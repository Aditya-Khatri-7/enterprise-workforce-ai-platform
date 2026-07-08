const bcrypt = require('bcrypt');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const Request = require('../models/Request');
const Department = require('../models/Department');
const { sendWelcomeEmail } = require('../utils/emailService');
const { createNotification, writeAuditLog } = require('../utils/notification');

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
    await writeAuditLog({
      userId: req.user._id,
      action: 'EMPLOYEE_CREATED',
      targetUserId: user._id,
      details: `Created employee: ${employeeId}`,
      req
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

    const roleName = req.user.role?.name;
    if (roleName !== 'Super Admin') {
      // Tenant-isolation check
      if (employee.organization && req.user.organization && employee.organization.toString() !== req.user.organization.toString()) {
        return res.status(403).json({ error: 'Forbidden. Employee belongs to another organization.' });
      }

      // Ownership and Role-scoping checks
      const isSelf = employee.userRef && employee.userRef.toString() === req.user._id.toString();
      const isStaffOrAdmin = ['Super Admin', 'Organization Admin', 'HR Manager', 'IT Administrator', 'Manager', 'Team Lead', 'Finance', 'Auditor'].includes(roleName);
      const isReportingManager = employee.reportingManager && employee.reportingManager.toString() === req.user.employeeRef?.toString();

      if (!isSelf && !isStaffOrAdmin && !isReportingManager) {
        return res.status(403).json({ error: 'Forbidden. You do not have permission to view this employee record.' });
      }
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

    // 2. Super Admin, Org Admin, and HR Manager directly commits changes
    if (['Super Admin', 'Organization Admin', 'HR Manager'].includes(req.user.role?.name)) {
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
      await writeAuditLog({
        userId: req.user._id,
        action: 'EMPLOYEE_UPDATED',
        targetUserId: employee.userRef,
        details: `${req.user.role.name} updated employee profile directly`,
        req
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

    await writeAuditLog({
      userId: req.user._id,
      action: 'EMPLOYEE_UPDATED',
      targetUserId: employeeToUpdate.userRef,
      details: `Profile change request submitted: Request ID ${request._id}`,
      req
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

    await writeAuditLog({
      userId: req.user._id,
      action: 'EMPLOYEE_ARCHIVED',
      targetUserId: employee.userRef,
      req
    });

    res.json({ message: 'Employee archived successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting employee' });
  }
};

const changeEmployeeDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentId, managerId } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    let departmentName = employee.department;
    if (departmentId) {
      const mongoose = require('mongoose');
      let dept = null;
      if (mongoose.isValidObjectId(departmentId)) {
        dept = await Department.findById(departmentId);
      } else {
        dept = await Department.findOne({ name: departmentId });
      }
      if (dept) {
        departmentName = dept.name;
      } else {
        departmentName = departmentId;
      }
    }

    employee.department = departmentName;

    if (managerId) {
      employee.reportingManager = managerId;
    } else if (managerId === null || managerId === 'null') {
      employee.reportingManager = null;
    }

    await employee.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'EMPLOYEE_DEPARTMENT_REASSIGNED',
      targetUserId: employee.userRef,
      details: { department: departmentName, managerId },
      req
    });

    if (employee.userRef) {
      await createNotification({
        recipient: employee.userRef,
        title: 'Department Reassigned',
        message: `You have been reassigned to the ${departmentName} department reporting to a new manager.`,
        organization: req.user.organization
      });
    }

    res.json({ message: 'Employee department and manager reassigned successfully.', employee });
  } catch (error) {
    console.error('Change Employee Department Error:', error);
    res.status(500).json({ error: 'Server error reassigning department' });
  }
};

const updateEmployeeResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { resumeText, resumeFileName, resumeFileBase64 } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const isSelf = employee.userRef && employee.userRef.toString() === req.user._id.toString();
    const isAdmin = ['Super Admin', 'Organization Admin', 'HR Manager'].includes(req.user.role?.name);
    
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to update this resume' });
    }

    if (resumeText !== undefined) employee.resumeText = resumeText;
    if (resumeFileName !== undefined) employee.resumeFileName = resumeFileName;
    if (resumeFileBase64 !== undefined) employee.resumeFileBase64 = resumeFileBase64;

    await employee.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'EMPLOYEE_RESUME_UPDATED',
      targetUserId: employee.userRef,
      details: { resumeFileName },
      req
    });

    res.json({ message: 'Resume updated successfully', employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamLeadRating, managerRating } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    if (!employee.ratings) {
      employee.ratings = { teamLeadRating: 0, managerRating: 0 };
    }

    const roleName = req.user.role?.name;
    const isTL = roleName === 'Team Lead';
    const isManager = ['Manager', 'Department Manager'].includes(roleName);
    const isAdmin = ['Super Admin', 'Organization Admin', 'HR Manager'].includes(roleName);

    if (!isTL && !isManager && !isAdmin) {
      return res.status(403).json({ error: 'Only Team Leads or Managers can grade ratings' });
    }

    if (teamLeadRating !== undefined && (isTL || isAdmin)) {
      employee.ratings.teamLeadRating = teamLeadRating;
    }
    if (managerRating !== undefined && (isManager || isAdmin)) {
      employee.ratings.managerRating = managerRating;
    }

    await employee.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'EMPLOYEE_RATING_SUBMITTED',
      targetUserId: employee.userRef,
      details: { teamLeadRating, managerRating },
      req
    });

    res.json({ message: 'Rating submitted successfully', employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  changeEmployeeDepartment,
  updateEmployeeResume,
  rateEmployee
};
