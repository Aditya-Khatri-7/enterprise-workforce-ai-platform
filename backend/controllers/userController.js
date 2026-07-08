const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const { createNotification, writeAuditLog } = require('../utils/notification');

const getUsers = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role.name !== 'Super Admin' && req.user.organization) {
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
      const allowedRoles = ['HR Manager', 'Finance', 'IT Administrator', 'Manager', 'Team Lead', 'Auditor'];
      if (!allowedRoles.includes(roleName)) {
        return res.status(403).json({ error: 'Forbidden. Organization Admin can only create HR Manager, Finance Executive, IT Administrator, Department Manager, Team Lead, or Auditor.' });
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

    const user = await User.findById(id).populate('organization').populate('role');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Organization Admin can only manage users within their own org
    if (req.user.role.name === 'Organization Admin' && user.organization?._id?.toString() !== req.user.organization?.toString()) {
      return res.status(403).json({ error: 'Forbidden. User belongs to another organization.' });
    }

    // HR Manager can only manage users in their own org, and cannot touch Org Admins or other HR Managers
    if (req.user.role.name === 'HR Manager') {
      if (user.organization?._id?.toString() !== req.user.organization?.toString()) {
        return res.status(403).json({ error: 'Forbidden. User belongs to another organization.' });
      }
      const protectedRoles = ['Organization Admin', 'HR Manager', 'Super Admin', 'Manager'];
      if (protectedRoles.includes(user.role?.name)) {
        return res.status(403).json({ error: 'Forbidden. HR Managers cannot manage admin, HR, or Department Manager accounts.' });
      }
    }

    if (isActive && user.organization && user.organization.status === 'Suspended') {
      return res.status(400).json({ error: 'Cannot activate user account belonging to a suspended organization' });
    }

    user.isActive = isActive;
    user.status = isActive ? 'Active' : 'Inactive';
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
    user.status = 'Active';
    user.isActive = true;
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

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('role');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Enforce Hierarchy for Deletion
    const requesterRole = req.user.role.name;
    const targetRole = user.role?.name;

    if (requesterRole !== 'Super Admin') {
      if (user.organization?.toString() !== req.user.organization?.toString()) {
        return res.status(403).json({ error: 'Forbidden. User belongs to another organization.' });
      }
    }

    let allowed = false;
    if (requesterRole === 'Super Admin') {
      if (targetRole !== 'Super Admin') allowed = true;
    } else if (requesterRole === 'Organization Admin') {
      if (targetRole !== 'Super Admin' && targetRole !== 'Organization Admin') allowed = true;
    } else if (requesterRole === 'HR Manager') {
      const HRProtected = ['Super Admin', 'Organization Admin', 'HR Manager', 'Manager'];
      if (!HRProtected.includes(targetRole)) allowed = true;
    }

    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to delete this user.' });
    }

    user.status = 'Deleted';
    user.isActive = false;
    await user.save();

    if (user.employeeRef) {
      await Employee.findByIdAndUpdate(user.employeeRef, { status: 'Terminated' });
    }

    await writeAuditLog({
      userId: req.user._id,
      action: 'USER_DELETED',
      targetUserId: user._id,
      details: `Soft deleted user account: ${user.username}`,
      req
    });

    res.json({ message: 'User deleted successfully (soft-delete)' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const id = req.params.id === 'me' ? req.user._id : req.params.id;
    const { reason } = req.body;

    const targetUser = await User.findById(id).populate('role').populate('employeeRef');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requesterRole = req.user.role.name;
    const targetRole = targetUser.role?.name;

    // Enforce organizational boundary
    if (requesterRole !== 'Super Admin') {
      if (targetUser.organization?.toString() !== req.user.organization?.toString()) {
        return res.status(403).json({ error: 'Forbidden. User belongs to another organization.' });
      }
    }

    // Enforce Hierarchy
    let allowed = false;
    if (requesterRole === 'Super Admin') {
      if (targetRole !== 'Super Admin') allowed = true;
    } else if (requesterRole === 'Organization Admin') {
      if (targetRole !== 'Super Admin' && targetRole !== 'Organization Admin') allowed = true;
    } else if (requesterRole === 'HR Manager') {
      const HRProtected = ['Super Admin', 'Organization Admin', 'HR Manager', 'Manager'];
      if (!HRProtected.includes(targetRole)) allowed = true;
    } else if (requesterRole === 'Team Lead') {
      // Must be an Employee and report to the Team Lead
      if (targetRole === 'Employee' && targetUser.employeeRef) {
        const emp = await Employee.findById(targetUser.employeeRef);
        if (emp && emp.reportingManager?.toString() === req.user.employeeRef?.toString()) {
          allowed = true;
        }
      }
    }

    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to deactivate this user.' });
    }

    targetUser.status = 'Suspended';
    targetUser.isActive = false;
    targetUser.suspendedBy = req.user._id;
    targetUser.suspendReason = reason || 'Suspended by supervisor';
    await targetUser.save();

    // Log the audit
    await writeAuditLog({
      userId: req.user._id,
      action: 'USER_SUSPENDED',
      targetUserId: targetUser._id,
      details: { reason: targetUser.suspendReason },
      req
    });

    // Notify user
    await createNotification({
      recipient: targetUser._id,
      title: 'Account Suspended',
      message: `Your account has been suspended by your superior. Reason: ${targetUser.suspendReason}`,
      organization: targetUser.organization
    });

    res.json({ message: 'User account suspended successfully', user: targetUser });
  } catch (error) {
    console.error('Deactivate User Error:', error);
    res.status(500).json({ error: 'Server error deactivating user' });
  }
};

const requestReactivation = async (req, res) => {
  try {
    const id = req.params.id === 'me' ? req.user._id : req.params.id;
    const { reason } = req.body;

    if (req.user._id.toString() !== id.toString()) {
      return res.status(403).json({ error: 'Forbidden. You can only request reactivation for yourself.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.reactivationRequest = {
      requestedAt: new Date(),
      reason: reason || 'Requested reactivation',
      status: 'Pending'
    };
    user.status = 'Deactivation_Requested'; // updates user status
    await user.save();

    await writeAuditLog({
      userId: user._id,
      action: 'REACTIVATION_REQUESTED',
      details: { reason },
      req
    });

    // Notify superior
    const role = await Role.findById(user.role);
    const roleName = role?.name;

    if (roleName === 'Organization Admin') {
      const superAdminRole = await Role.findOne({ name: 'Super Admin' });
      if (superAdminRole) {
        const superAdmins = await User.find({ role: superAdminRole._id });
        for (const sa of superAdmins) {
          await createNotification({
            recipient: sa._id,
            title: 'Reactivation Request',
            message: `Org Admin ${user.username} has requested reactivation.`,
            organization: null
          });
        }
      }
    } else {
      const orgAdminRole = await Role.findOne({ name: 'Organization Admin' });
      const hrRole = await Role.findOne({ name: 'HR Manager' });
      
      let recipientRole = orgAdminRole;
      if (roleName === 'Employee' || roleName === 'Team Lead' || roleName === 'Manager') {
        recipientRole = hrRole || orgAdminRole;
      }

      if (recipientRole) {
        const superiors = await User.find({ role: recipientRole._id, organization: user.organization });
        for (const sup of superiors) {
          await createNotification({
            recipient: sup._id,
            title: 'Reactivation Request',
            message: `User ${user.username} (${roleName}) has requested account reactivation.`,
            organization: user.organization
          });
        }
      }
    }

    res.json({ message: 'Reactivation request sent. Your manager has been notified.', user });
  } catch (error) {
    console.error('Request Reactivation Error:', error);
    res.status(500).json({ error: 'Server error requesting reactivation' });
  }
};

const reviewReactivation = async (req, res) => {
  try {
    const id = req.params.id === 'me' ? req.user._id : req.params.id;
    const { action } = req.body;

    const targetUser = await User.findById(id).populate('role');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (action === 'Approve') {
      targetUser.status = 'Active';
      targetUser.isActive = true;
      if (targetUser.reactivationRequest) {
        targetUser.reactivationRequest.status = 'Approved';
      }
      targetUser.suspendedBy = undefined;
      targetUser.suspendReason = undefined;
      await targetUser.save();

      await writeAuditLog({
        userId: req.user._id,
        action: 'REACTIVATION_APPROVED',
        targetUserId: targetUser._id,
        details: 'Approved reactivation request',
        req
      });

      await createNotification({
        recipient: targetUser._id,
        title: 'Account Reactivated',
        message: 'Your reactivation request has been approved. You can now log in.',
        organization: targetUser.organization
      });

      res.json({ message: 'Account reactivated successfully', user: targetUser });
    } else {
      targetUser.status = 'Suspended';
      targetUser.isActive = false;
      if (targetUser.reactivationRequest) {
        targetUser.reactivationRequest.status = 'Rejected';
      }
      await targetUser.save();

      await writeAuditLog({
        userId: req.user._id,
        action: 'REACTIVATION_REJECTED',
        targetUserId: targetUser._id,
        details: 'Rejected reactivation request',
        req
      });

      await createNotification({
        recipient: targetUser._id,
        title: 'Reactivation Rejected',
        message: 'Your reactivation request has been rejected. Please contact support.',
        organization: targetUser.organization
      });

      res.json({ message: 'Reactivation request rejected', user: targetUser });
    }
  } catch (error) {
    console.error('Review Reactivation Error:', error);
    res.status(500).json({ error: 'Server error reviewing reactivation' });
  }
};

const getReactivationStatus = async (req, res) => {
  try {
    const id = req.params.id === 'me' ? req.user._id : req.params.id;

    const roleName = req.user.role?.name;
    if (req.user._id.toString() !== id.toString() && !['Super Admin', 'Organization Admin', 'HR Manager'].includes(roleName)) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to view this reactivation status.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      status: user.status,
      reactivationRequest: user.reactivationRequest || null
    });
  } catch (error) {
    console.error('Get Reactivation Status Error:', error);
    res.status(500).json({ error: 'Server error fetching reactivation status' });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;

    if (!newRole) {
      return res.status(400).json({ error: 'New role is required' });
    }

    const targetUser = await User.findById(id).populate('role');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requesterRole = req.user.role.name;

    // Enforce organizational boundary
    if (requesterRole !== 'Super Admin') {
      if (targetUser.organization?.toString() !== req.user.organization?.toString()) {
        return res.status(403).json({ error: 'Forbidden. User belongs to another organization.' });
      }
    }

    // Role restrictions for HR Manager
    if (requesterRole === 'HR Manager') {
      const targetRoleName = targetUser.role?.name;
      const protectedRoles = ['Super Admin', 'Organization Admin', 'HR Manager'];
      if (protectedRoles.includes(targetRoleName)) {
        return res.status(403).json({ error: 'Forbidden. HR Managers cannot change roles of administrators or HR accounts.' });
      }
      if (protectedRoles.includes(newRole)) {
        return res.status(403).json({ error: 'Forbidden. HR Managers cannot assign admin or HR roles.' });
      }
    }

    const roleObj = await Role.findOne({ name: newRole });
    if (!roleObj) {
      return res.status(400).json({ error: `Role ${newRole} not found in database.` });
    }

    const oldRoleName = targetUser.role?.name;
    targetUser.role = roleObj._id;
    await targetUser.save();

    if (targetUser.employeeRef) {
      await Employee.findByIdAndUpdate(targetUser.employeeRef, { designation: newRole });
    }

    await writeAuditLog({
      userId: req.user._id,
      action: 'ROLE_UPDATED',
      targetUserId: targetUser._id,
      details: `Changed role of user ${targetUser.username} from ${oldRoleName} to ${newRole}`,
      req
    });

    await createNotification({
      recipient: targetUser._id,
      title: 'Security Role Updated',
      message: `Your system role has been updated from ${oldRoleName} to ${newRole}.`,
      organization: targetUser.organization
    });

    res.json({ message: `User role updated to ${newRole} successfully.`, user: targetUser });
  } catch (error) {
    console.error('Change User Role Error:', error);
    res.status(500).json({ error: 'Server error updating user role' });
  }
};

module.exports = {
  getUsers,
  createUser,
  toggleUserStatus,
  unlockUser,
  resetUserPassword,
  deleteUser,
  deactivateUser,
  requestReactivation,
  reviewReactivation,
  getReactivationStatus,
  changeUserRole
};
