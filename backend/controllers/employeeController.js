const bcrypt = require('bcrypt');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const Request = require('../models/Request');
const { sendWelcomeEmail } = require('../utils/emailService');

// Utility to generate random passwords meeting complexity rules (BR-02 and BR-03)
const generatePassword = () => {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  const special = '!@#$%^&*';
  const all = lower + upper + nums + special;
  
  let password = '';
  // Guarantee at least one of each character class
  password += lower.charAt(Math.floor(Math.random() * lower.length));
  password += upper.charAt(Math.floor(Math.random() * upper.length));
  password += nums.charAt(Math.floor(Math.random() * nums.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  // Fill the remaining length of 12
  for (let i = 4; i < 12; i++) {
    password += all.charAt(Math.floor(Math.random() * all.length));
  }
  
  // Shuffle the password characters to avoid a predictable pattern
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// Utility to generate Employee ID
const generateEmployeeId = async () => {
  const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
  if (!lastEmployee) {
    return 'EMP0001';
  }
  const match = lastEmployee.employeeId.match(/EMP(\d+)/);
  if (match) {
    const nextNumber = parseInt(match[1], 10) + 1;
    return `EMP${String(nextNumber).padStart(4, '0')}`;
  }
  const count = await Employee.countDocuments();
  return `EMP${String(count + 1).padStart(4, '0')}`;
};

const createEmployee = async (req, res) => {
  try {
    const { 
      firstName, lastName, email, phone, department, 
      designation, roleName, joiningDate, reportingManager, gender, dob, bloodGroup, address 
    } = req.body;

    // 1. Validation
    if (!firstName || !lastName || !email || !department || !designation || !roleName || !joiningDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // 2. Generate Credentials & ID
    const employeeId = await generateEmployeeId();
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 3. Create User account
    const user = new User({
      email,
      username,
      password: hashedPassword,
      role: role._id,
      organization: req.user?.organization || null,
      mustChangePassword: true
    });
    await user.save();

    // 4. Create Employee record
    const employee = new Employee({
      employeeId,
      firstName,
      lastName,
      email,
      mobile: phone,
      department,
      designation,
      reportingManager: reportingManager || null,
      joiningDate,
      gender,
      dob,
      bloodGroup,
      address,
      userRef: user._id
    });
    await employee.save();

    // Link employee to user
    user.employeeRef = employee._id;
    await user.save();

    // 5. Audit Log
    await AuditLog.create({
      action: 'EMPLOYEE_CREATED',
      userRef: req.user._id,
      targetUserRef: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Created employee: ${employeeId}`
    });

    // 6. Send welcome email with credentials
    try {
      await sendWelcomeEmail({
        to: email,
        firstName,
        email,
        temporaryPassword: plainPassword,
      });
    } catch (emailErr) {
      console.error('Welcome email failed to send (employee was still created):', emailErr.message);
    }

    res.status(201).json({
      message: 'Employee created successfully. Login credentials have been sent to their email.',
      employee,
      credentials: {
        username,
        email,
        temporaryPassword: plainPassword
      }
    });

  } catch (error) {
    console.error('Create Employee Error:', error);
    res.status(500).json({ error: 'Server error creating employee' });
  }
};

const getEmployees = async (req, res) => {
  try {
    const roleName = req.user.role?.name;

    // Super Admin sees all employees; otherwise scope to org
    let filter = {};
    if (roleName !== 'Super Admin' && req.user.organization) {
      // Find all user IDs in the same org, then filter employees by userRef
      const orgUserIds = await User.find({ organization: req.user.organization }).select('_id').lean();
      filter = { userRef: { $in: orgUserIds.map(u => u._id) } };
    }

    const employees = await Employee.find(filter)
      .populate({ path: 'userRef', select: 'isActive username email role', populate: { path: 'role', select: 'name' } })
      .populate('reportingManager', 'firstName lastName employeeId');

    res.json(employees);
  } catch (error) {
    console.error('Get Employees Error:', error);
    res.status(500).json({ error: 'Server error fetching employees' });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate({
      path: 'userRef',
      populate: { path: 'role', select: 'name' }
    }).populate('reportingManager', 'firstName lastName employeeId');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching employee' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeToUpdate = await Employee.findById(id);
    if (!employeeToUpdate) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // 1. Instant update if only updating profilePhoto
    const keys = Object.keys(req.body);
    if (keys.length === 1 && keys[0] === 'profilePhoto') {
      const employee = await Employee.findByIdAndUpdate(id, req.body, { new: true });
      return res.json({ message: 'Profile photo updated successfully', employee });
    }

    // 2. Super Admin directly commits changes
    if (req.user.role?.name === 'Super Admin') {
      const { email } = req.body;
      if (email && email !== employeeToUpdate.email) {
        const existingUser = await User.findOne({ email, employeeRef: { $ne: id } });
        const existingEmployee = await Employee.findOne({ email, _id: { $ne: id } });
        if (existingUser || existingEmployee) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        if (employeeToUpdate.userRef) {
          await User.findByIdAndUpdate(employeeToUpdate.userRef, { email });
        }
      }
      const employee = await Employee.findByIdAndUpdate(id, req.body, { new: true });
      await AuditLog.create({
        action: 'EMPLOYEE_UPDATED',
        userRef: req.user._id,
        targetUserRef: employee.userRef,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Super Admin updated employee profile directly'
      });
      return res.json({ message: 'Employee updated successfully', employee });
    }

    // 3. Create centralized Request for regular profiles
    let requestType = 'Profile Edit Request';
    if (req.body.department && req.body.department !== employeeToUpdate.department) {
      requestType = 'Department Transfer';
    } else if (req.body.reportingManager && req.body.reportingManager !== String(employeeToUpdate.reportingManager)) {
      requestType = 'Manager Change';
    } else if (req.body.salary && Number(req.body.salary) !== employeeToUpdate.salary) {
      requestType = 'Salary Revision';
    } else if (req.body.designation && req.body.designation !== employeeToUpdate.designation) {
      requestType = 'Employee Promotion';
    }

    const previousValues = {};
    const newValues = {};

    for (const key of keys) {
      if (req.body[key] !== undefined) {
        previousValues[key] = employeeToUpdate[key];
        newValues[key] = req.body[key];
      }
    }

    if (newValues.email && newValues.email !== employeeToUpdate.email) {
      const existingUser = await User.findOne({ email: newValues.email, employeeRef: { $ne: id } });
      const existingEmployee = await Employee.findOne({ email: newValues.email, _id: { $ne: id } });
      if (existingUser || existingEmployee) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const request = new Request({
      requestType,
      requester: req.user._id,
      targetUser: employeeToUpdate.userRef,
      organization: req.user.organization,
      priority: requestType === 'Profile Edit Request' ? 'Medium' : 'High',
      previousValues,
      newValues,
      remarks: `Submitted profile updates for ${employeeToUpdate.firstName} ${employeeToUpdate.lastName}`,
      timeline: [{
        status: 'Pending',
        actor: req.user._id,
        remarks: 'Request submitted for review.'
      }]
    });

    await request.save();

    await AuditLog.create({
      action: 'EMPLOYEE_UPDATED',
      userRef: req.user._id,
      targetUserRef: employeeToUpdate.userRef,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Profile change request submitted: Request ID ${request._id}`
    });

    res.json({
      message: 'Profile update request has been submitted for administrative approval.',
      requestPending: true,
      request
    });

  } catch (error) {
    console.error('Update Employee Error:', error);
    res.status(500).json({ error: 'Server error updating employee' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Archive instead of hard delete for enterprise
    employee.status = 'Archived';
    await employee.save();

    await User.findByIdAndUpdate(employee.userRef, { isActive: false, isLocked: true });

    await AuditLog.create({
      action: 'EMPLOYEE_ARCHIVED',
      userRef: req.user._id,
      targetUserRef: employee.userRef,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'Employee archived successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting employee' });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
