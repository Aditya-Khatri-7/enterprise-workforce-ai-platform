const bcrypt = require('bcrypt');
const https = require('https');
const querystring = require('querystring');
const User = require('../models/User');
const Employee = require('../models/Employee');
const RefreshToken = require('../models/RefreshToken');
const AuditLog = require('../models/AuditLog');
const Otp = require('../models/Otp');
const { generateAccessToken, generateRefreshToken, verifyToken, getAccessTokenExpiryMs } = require('../utils/jwt');
const { sendOtpEmail } = require('../utils/emailService');

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Password must have a minimum length of 8 characters.';
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=~`\[\]\\/;]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
  }
  return null;
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};


/**
 * Verify a reCAPTCHA v2 token with Google's API.
 * Returns a promise that resolves to true if valid, false otherwise.
 */
const verifyRecaptcha = (token) => {
  return new Promise((resolve) => {
    const postData = querystring.stringify({
      secret: process.env.RECAPTCHA_SECRET_KEY.trim(),
      response: token,
    });

    const options = {
      hostname: 'www.google.com',
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.success === true);
        } catch {
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.write(postData);
    req.end();
  });
};

const login = async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    // --- reCAPTCHA verification ---
    if (process.env.NODE_ENV === 'production') {
      if (!recaptchaToken) {
        return res.status(400).json({ error: 'reCAPTCHA token is missing. Please complete the verification.' });
      }

      const isHuman = await verifyRecaptcha(recaptchaToken);
      if (!isHuman) {
        return res.status(400).json({ error: 'reCAPTCHA verification failed. Please try again.' });
      }
    }
    // --- end reCAPTCHA verification ---

    if (!email || !password) {
      return res.status(400).json({ error: 'Email, username, or employee ID and password are required' });
    }

    const loginId = email.trim();

    let user = await User.findOne({
      $or: [
        { email: loginId.toLowerCase() },
        { username: { $regex: new RegExp(`^${loginId}$`, 'i') } }
      ]
    }).populate('role');

    if (!user) {
      // Find employee by employeeId (case-insensitive)
      const employee = await Employee.findOne({
        employeeId: { $regex: new RegExp(`^${loginId}$`, 'i') }
      });
      if (employee) {
        user = await User.findOne({ employeeRef: employee._id }).populate('role');
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
      }
      await user.save();
      
      await AuditLog.create({
        action: 'FAILED_LOGIN',
        userRef: user._id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        organization: user.organization
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isLocked) {
      return res.status(403).json({ error: 'Account is locked. Please contact Admin' });
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      token: refreshToken,
      userRef: user._id,
      expiresAt
    });

    await AuditLog.create({
      action: 'LOGIN',
      userRef: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      organization: user.organization
    });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: getAccessTokenExpiryMs() }); // matching config
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Fetch the full user with populated refs so the frontend has everything it needs
    const fullUser = await User.findById(user._id)
      .select('-password -failedLoginAttempts')
      .populate('role')
      .populate('employeeRef')
      .populate('organization', 'name organizationId status');

    res.json({
      message: 'Login successful',
      user: {
        ...fullUser.toObject(),
        role: fullUser.role?.name,       // normalize to string for frontend
        mustChangePassword: user.mustChangePassword
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await RefreshToken.findOneAndUpdate({ token: refreshToken }, { revoked: true });
    }

    if (req.user) {
      await AuditLog.create({
        action: 'LOGOUT',
        userRef: req.user._id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        organization: req.user.organization
      });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during logout' });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken, revoked: false });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired or revoked' });
    }

    const user = await User.findById(decoded.userId).populate('role');
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    if (user.isLocked) {
      return res.status(403).json({ error: 'Account is locked. Please contact Admin' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    const newAccessToken = generateAccessToken(user);
    res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: getAccessTokenExpiryMs() });

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during token refresh' });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -failedLoginAttempts')
      .populate('role')
      .populate('employeeRef')
      .populate('organization', 'name organizationId status');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      return res.status(400).json({ error: pwdError });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    await AuditLog.create({
      action: 'PASSWORD_CHANGE',
      userRef: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      organization: user.organization
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during password change' });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database
    await Otp.deleteMany({ email }); // Delete old OTPs for this email
    await Otp.create({ email, otp: otpCode });

    // Send OTP via shared email service
    await sendOtpEmail({ to: email, otpCode });

    res.json({ message: 'OTP sent to email successfully' });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      return res.status(400).json({ error: pwdError });
    }
    
    // Verify OTP
    const storedOtp = await Otp.findOne({ email, otp });
    if (!storedOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    // Delete OTP after successful reset
    await Otp.deleteMany({ email });

    await AuditLog.create({
      action: 'PASSWORD_CHANGE',
      userRef: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      organization: user.organization
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
};

module.exports = {
  login,
  logout,
  refresh,
  me,
  changePassword,
  forgotPassword,
  resetPassword
};
