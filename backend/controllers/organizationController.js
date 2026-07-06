const bcrypt = require('bcrypt');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Role = require('../models/Role');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const Department = require('../models/Department');
const LeaveRequest = require('../models/LeaveRequest');
const SupportRequest = require('../models/SupportRequest');
const RefreshToken = require('../models/RefreshToken');
const Otp = require('../models/Otp');
const { createNotification, writeAuditLog } = require('../utils/notification');

const createOrganization = async (req, res) => {
  try {
    const { name, email, address, subscriptionPlan } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existingOrg = await Organization.findOne({ $or: [{ name }, { email }] });
    if (existingOrg) {
      return res.status(400).json({ error: 'Organization name or email already exists' });
    }

    // Auto-generate Organization ID
    let organizationId = 'ORG0001';
    const lastOrg = await Organization.findOne().sort({ organizationId: -1 });
    if (lastOrg) {
      const match = lastOrg.organizationId.match(/ORG(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1], 10) + 1;
        organizationId = `ORG${String(nextNumber).padStart(4, '0')}`;
      } else {
        const count = await Organization.countDocuments();
        organizationId = `ORG${String(count + 1).padStart(4, '0')}`;
      }
    }

    const org = new Organization({
      organizationId,
      name,
      email,
      address,
      subscriptionPlan: subscriptionPlan || 'Basic',
      status: 'Active'
    });
    await org.save();

    await AuditLog.create({
      action: 'ORGANIZATION_CREATED',
      userRef: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Created organization: ${name} (${organizationId})`
    });

    res.status(201).json({ message: 'Organization created successfully', organization: org });
  } catch (error) {
    console.error('Create Organization Error:', error);
    res.status(500).json({ error: 'Server error creating organization' });
  }
};

const assignAdmin = async (req, res) => {
  try {
    const { organizationId, name, email, phone, password } = req.body;
    if (!organizationId || !name || !email || !password) {
      return res.status(400).json({ error: 'Organization ID, Name, Email, and Password are required' });
    }

    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User email already exists' });
    }

    const orgAdminRole = await Role.findOne({ name: 'Organization Admin' });
    if (!orgAdminRole) {
      return res.status(500).json({ error: 'Organization Admin role not configured in system' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const username = email.split('@')[0];

    const user = new User({
      email,
      username,
      password: hashedPassword,
      role: orgAdminRole._id,
      organization: org._id,
      mustChangePassword: true
    });
    await user.save();

    // Create a base Employee profile for the Org Admin so the dashboard has populated data
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
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || 'Admin',
      email,
      mobile: phone,
      department: 'Management',
      designation: 'Organization Admin',
      joiningDate: new Date(),
      userRef: user._id
    });
    await employee.save();

    user.employeeRef = employee._id;
    await user.save();

    await AuditLog.create({
      action: 'USER_CREATED',
      userRef: req.user._id,
      targetUserRef: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Assigned initial Admin: ${username} to Organization: ${org.name}`
    });

    res.status(201).json({ message: 'Organization Admin assigned successfully', user });
  } catch (error) {
    console.error('Assign Admin Error:', error);
    res.status(500).json({ error: 'Server error assigning admin' });
  }
};

const updateOrganizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Suspended', 'Deleted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const org = await Organization.findById(id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    org.status = status;
    await org.save();

    // If suspended or deleted, deactivate all users in that organization!
    if (status === 'Suspended' || status === 'Deleted') {
      await User.updateMany({ organization: org._id }, { isActive: false });
    } else if (status === 'Active') {
      await User.updateMany({ organization: org._id }, { isActive: true });
    }

    await AuditLog.create({
      action: 'USER_STATUS_UPDATED',
      userRef: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Updated organization ${org.name} status to: ${status}`
    });

    res.json({ message: `Organization status updated to ${status} successfully`, organization: org });
  } catch (error) {
    console.error('Update Org Status Error:', error);
    res.status(500).json({ error: 'Server error updating status' });
  }
};

const getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.json(organizations);
  } catch (error) {
    console.error('Get Organizations Error:', error);
    res.status(500).json({ error: 'Server error fetching organizations' });
  }
};

const assignAdminToOrg = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { userId } = req.body;

    if (!orgId || !userId) {
      return res.status(400).json({ error: 'Organization ID and User ID are required' });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const orgAdminRole = await Role.findOne({ name: 'Organization Admin' });
    if (!orgAdminRole) {
      return res.status(500).json({ error: 'Organization Admin role not configured in the system' });
    }

    user.role = orgAdminRole._id;
    user.organization = org._id;
    user.orgId = org._id;
    await user.save();

    // Check if employee record already exists for this user
    let employee = await Employee.findOne({ userRef: user._id });
    if (!employee) {
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

      employee = new Employee({
        employeeId,
        firstName: user.username,
        lastName: 'Admin',
        email: user.email,
        department: 'Management',
        designation: 'Organization Admin',
        joiningDate: new Date(),
        userRef: user._id
      });
      await employee.save();

      user.employeeRef = employee._id;
      await user.save();
    } else {
      // update employee department/designation to match admin role
      employee.department = 'Management';
      employee.designation = 'Organization Admin';
      await employee.save();
    }

    // Write audit log
    await writeAuditLog({
      userId: req.user._id,
      action: 'ADMIN_ASSIGNED',
      targetUserId: user._id,
      details: `Assigned user ${user.username} as Admin of ${org.name}`,
      req
    });

    // Send notification
    await createNotification({
      recipient: user._id,
      title: 'Admin Role Assigned',
      message: `You have been assigned as the Admin of organization ${org.name}.`,
      organization: org._id
    });

    res.json({ message: 'Organization Admin assigned successfully', user, employee });
  } catch (error) {
    console.error('Assign Admin To Org Error:', error);
    res.status(500).json({ error: 'Server error assigning admin to organization' });
  }
};

const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    const org = await Organization.findById(id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // 1. Find all users associated with this organization
    const users = await User.find({ organization: id }).populate('role');
    const userIds = users.map(u => u._id);
    const userEmails = users.map(u => u.email);

    // Filter to find non-admin users in the org
    const nonAdminUsers = users.filter(u => u.role && u.role.name !== 'Organization Admin' && u.role.name !== 'Super Admin');
    const nonAdminUserIds = nonAdminUsers.map(u => u._id);

    // 2. Check if any non-admin employees exist under it
    const employeeCount = await Employee.countDocuments({ userRef: { $in: nonAdminUserIds } });
    if (employeeCount > 0) {
      return res.status(400).json({ error: 'Cannot delete organization. Employees exist under this organization.' });
    }

    // 3. Delete all Employees referencing these users
    await Employee.deleteMany({ userRef: { $in: userIds } });

    // 4. Delete Refresh Tokens
    await RefreshToken.deleteMany({ userRef: { $in: userIds } });

    // 5. Delete Otp records
    await Otp.deleteMany({ email: { $in: userEmails } });

    // 6. Delete Leave Requests
    await LeaveRequest.deleteMany({ organization: id });

    // 7. Delete Support Requests
    await SupportRequest.deleteMany({ organization: id });

    // 8. Delete Departments
    await Department.deleteMany({ organization: id });

    // 9. Delete Users
    await User.deleteMany({ organization: id });

    // 10. Delete the Organization
    await Organization.findByIdAndDelete(id);

    // 11. Log the action
    await writeAuditLog({
      userId: req.user._id,
      action: 'ORGANIZATION_DELETED',
      details: `Deleted organization: ${org.name} (${org.organizationId})`,
      req
    });

    res.json({ message: 'Organization and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete Organization Error:', error);
    res.status(500).json({ error: 'Server error deleting organization' });
  }
};

module.exports = {
  createOrganization,
  assignAdmin,
  assignAdminToOrg,
  updateOrganizationStatus,
  getOrganizations,
  deleteOrganization
};
