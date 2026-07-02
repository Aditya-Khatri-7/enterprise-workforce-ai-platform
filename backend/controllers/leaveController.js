const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');

const applyLeave = async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;
    if (!startDate || !endDate || !type || !reason) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const employee = await Employee.findOne({ userRef: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found. Please contact HR.' });
    }
    if (!req.user.organization) {
      return res.status(400).json({ error: 'Not associated with any organization' });
    }

    const leave = new LeaveRequest({
      employee: employee._id,
      organization: req.user.organization,
      startDate,
      endDate,
      type,
      reason,
      status: 'Pending'
    });
    await leave.save();

    res.status(201).json({ message: 'Leave application submitted successfully', leave });
  } catch (error) {
    console.error('Apply Leave Error:', error);
    res.status(500).json({ error: 'Server error applying for leave' });
  }
};

const getLeaves = async (req, res) => {
  try {
    const roleName = req.user.role?.name;
    let filter = {};

    if (roleName === 'Employee') {
      const employee = await Employee.findOne({ userRef: req.user._id });
      if (!employee) return res.json([]);
      filter = { employee: employee._id };
    } else {
      // Org Admin, HR Manager see all leaves in their org
      filter = { organization: req.user.organization };
    }

    const leaves = await LeaveRequest.find(filter)
      .populate({ path: 'employee', select: 'firstName lastName employeeId department designation' })
      .populate({ path: 'approvedBy', select: 'username email' })
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error('Get Leaves Error:', error);
    res.status(500).json({ error: 'Server error fetching leaves' });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Approved or Rejected' });
    }

    const leave = await LeaveRequest.findOne({ _id: id, organization: req.user.organization });
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    leave.status = status;
    leave.approvedBy = req.user._id;
    await leave.save();

    res.json({ message: `Leave ${status.toLowerCase()} successfully`, leave });
  } catch (error) {
    console.error('Update Leave Status Error:', error);
    res.status(500).json({ error: 'Server error updating leave status' });
  }
};

module.exports = { applyLeave, getLeaves, updateLeaveStatus };
