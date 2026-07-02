const jwt = require('jsonwebtoken');

const getAccessTokenExpiryMs = () => {
  const expiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
};

const generateAccessToken = (user) => {
  const expiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  return jwt.sign(
    { userId: user._id, role: user.role.name },
    process.env.JWT_SECRET,
    { expiresIn: expiry }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET, // Note: usually a separate REFRESH_TOKEN_SECRET is preferred, but using JWT_SECRET as per .env
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getAccessTokenExpiryMs
};

