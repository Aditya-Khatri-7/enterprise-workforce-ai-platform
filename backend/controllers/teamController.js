const Employee = require('../models/Employee');
const User = require('../models/User');
const Role = require('../models/Role');
const { createNotification, writeAuditLog } = require('../utils/notification');

const reassignEmployee = async (req, res) => {
  try {
    const { employeeId, fromTeamLeadId, toTeamLeadId } = req.body;

    if (!employeeId || !toTeamLeadId) {
      return res.status(400).json({ error: 'Employee ID and destination Team Lead ID are required.' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const toLead = await Employee.findById(toTeamLeadId);
    if (!toLead) {
      return res.status(404).json({ error: 'Target Team Lead not found' });
    }

    const oldManagerId = employee.reportingManager;
    employee.reportingManager = toLead._id;
    await employee.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'TEAM_REASSIGNMENT',
      targetUserId: employee.userRef,
      details: { fromTeamLeadId, toTeamLeadId },
      req
    });

    if (employee.userRef) {
      await createNotification({
        recipient: employee.userRef,
        title: 'Team Reassigned',
        message: `You have been reassigned to ${toLead.firstName} ${toLead.lastName}'s team.`,
        organization: req.user.organization
      });
    }

    if (oldManagerId) {
      const oldLead = await Employee.findById(oldManagerId);
      if (oldLead && oldLead.userRef) {
        await createNotification({
          recipient: oldLead.userRef,
          title: 'Member Transferred Out',
          message: `${employee.firstName} ${employee.lastName} has been transferred out of your team to ${toLead.firstName} ${toLead.lastName}'s team.`,
          organization: req.user.organization
        });
      }
    }

    if (toLead.userRef) {
      await createNotification({
        recipient: toLead.userRef,
        title: 'Member Transferred In',
        message: `${employee.firstName} ${employee.lastName} has been transferred to your team.`,
        organization: req.user.organization
      });
    }

    res.json({ message: 'Employee reassigned successfully.', employee });
  } catch (error) {
    console.error('Reassign Employee Error:', error);
    res.status(500).json({ error: 'Server error reassigning team member' });
  }
};

const getAvailableLeads = async (req, res) => {
  try {
    let department = null;
    const reqEmp = await Employee.findOne({ userRef: req.user._id });
    if (reqEmp) {
      department = reqEmp.department;
    }

    const tlRole = await Role.findOne({ name: 'Team Lead' });
    if (!tlRole) {
      return res.status(404).json({ error: 'Team Lead role not found in configuration' });
    }

    const tlUsers = await User.find({ role: tlRole._id });
    const tlUserIds = tlUsers.map(u => u._id);

    let query = { userRef: { $in: tlUserIds } };
    if (department) {
      query.department = department;
    }

    if (reqEmp) {
      query._id = { $ne: reqEmp._id };
    }

    const leads = await Employee.find(query);
    res.json(leads);
  } catch (error) {
    console.error('Get Available Leads Error:', error);
    res.status(500).json({ error: 'Server error fetching available leads' });
  }
};

module.exports = {
  reassignEmployee,
  getAvailableLeads
};
