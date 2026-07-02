const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

const getUsers = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role.name === 'Organization Admin' || req.user.role.name === 'IT Administrator') {
      filter = { organization: req.user.organization };
    }
    // Fetch users, populate role, organization, employeeRef
    const users = await User.find(filter)
      .populate('role')
      .populate('organization')
      .populate('employeeRef')
      .select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, roleName, organizationId, firstName, lastName, department, designation } = req.body;
    if (!username || !email || !password || !roleName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Enforce organizational boundaries
    let targetOrgId = null;
    if (req.user.role.name === 'Super Admin') {
      if (roleName === 'Organization Admin') {
        if (!organizationId) {
          return res.status(400).json({ error: 'Organization is required for Organization Admin' });
        }
        targetOrgId = organizationId;
      }
    } else if (req.user.role.name === 'Organization Admin') {
      targetOrgId = req.user.organization;
      if (roleName === 'Super Admin') {
        return res.status(403).json({ error: 'Forbidden. Cannot create Super Admin.' });
      }
    } else {
      return res.status(403).json({ error: 'Forbidden. Unauthorized to create users.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role._id,
      organization: targetOrgId,
      mustChangePassword: true
    });

    await newUser.save();

    // Create a corresponding Employee record if not a Super Admin to ensure references work perfectly
    if (roleName !== 'Super Admin') {
      const fName = firstName || username;
      const lName = lastName || 'User';
      const dept = department || 'General';
      const desig = designation || roleName;
      
      let employeeId = 'EMP0001';
      const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
      if (lastEmployee) {
        const match = lastEmployee.employeeId.match(/EMP(\d+)/);
        if (match) {
          const nextNumber = parseInt(match[1], 10) + 1;
          employeeId = `EMP${String(nextNumber).padStart(4, '0')}`;
        } else {
          const count = await Employee.countDocuments();
          employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
        }
      }

      const employee = new Employee({
        employeeId,
        firstName: fName,
        lastName: lName,
        email,
        department: dept,
        designation: desig,
        joiningDate: new Date(),
        userRef: newUser._id
      });
      await employee.save();

      newUser.employeeRef = employee._id;
      await newUser.save();
    }

    await AuditLog.create({
      action: 'USER_CREATED',
      userRef: req.user._id,
      targetUserRef: newUser._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Created user account: ${username} (${roleName})`
    });

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ error: 'Server error creating user' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.role.name === 'Organization Admin' && user.organization?.toString() !== req.user.organization?.toString()) {
      return res.status(403).json({ error: 'Forbidden. User belongs to another organization.' });
    }

    user.isActive = isActive;
    await user.save();

    await AuditLog.create({
      action: 'USER_STATUS_UPDATED',
      userRef: req.user._id,
      targetUserRef: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Updated user status: ${isActive ? 'Active' : 'Inactive'}`
    });

    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.error('Toggle User Status Error:', error);
    res.status(500).json({ error: 'Server error toggling user status' });
  }
};

const unlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.role.name === 'IT Administrator' && user.organization?.toString() !== req.user.organization?.toString()) {
      return res.status(403).json({ error: 'Forbidden. User belongs to another organization.' });
    }

    user.isLocked = false;
    user.failedLoginAttempts = 0;
    await user.save();

    await AuditLog.create({
      action: 'USER_UNLOCKED',
      userRef: req.user._id,
      targetUserRef: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Unlocked user account: ${user.username}`
    });

    res.json({ message: 'User account unlocked successfully' });
  } catch (error) {
    console.error('Unlock User Error:', error);
    res.status(500).json({ error: 'Server error unlocking user' });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.role.name === 'IT Administrator' && user.organization?.toString() !== req.user.organization?.toString()) {
      return res.status(403).json({ error: 'Forbidden. User belongs to another organization.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = true;
    await user.save();

    await AuditLog.create({
      action: 'USER_PASSWORD_RESET',
      userRef: req.user._id,
      targetUserRef: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Reset password for user: ${user.username}`
    });

    res.json({ message: 'User password reset successfully' });
  } catch (error) {
    console.error('Reset User Password Error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
};

module.exports = {
  getUsers,
  createUser,
  toggleUserStatus,
  unlockUser,
  resetUserPassword
};
