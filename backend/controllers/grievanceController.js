const Grievance = require('../models/Grievance');
const Employee = require('../models/Employee');
const { writeAuditLog } = require('../utils/notification');

const createGrievance = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const employee = await Employee.findOne({ userRef: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const grievance = new Grievance({
      employee: employee._id,
      organization: req.user.organization,
      title,
      description,
      status: 'Pending'
    });

    await grievance.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'GRIEVANCE_RAISED',
      targetUserId: req.user._id,
      details: { title },
      req
    });

    res.status(201).json(grievance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGrievances = async (req, res) => {
  try {
    const roleName = req.user.role?.name;
    const orgId = req.user.organization;
    let filter = { organization: orgId };

    if (roleName === 'Employee') {
      const employee = await Employee.findOne({ userRef: req.user._id });
      if (!employee) return res.json([]);
      filter.employee = employee._id;
    }

    const grievances = await Grievance.find(filter)
      .populate('employee', 'firstName lastName department designation employeeId')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(grievances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resolveGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    if (!resolution) {
      return res.status(400).json({ error: 'Resolution is required' });
    }

    const employee = await Employee.findOne({ userRef: req.user._id });
    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    grievance.status = 'Resolved';
    grievance.resolution = resolution;
    grievance.resolvedBy = employee ? employee._id : undefined;

    await grievance.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'GRIEVANCE_RESOLVED',
      targetUserId: grievance.employee,
      details: { resolution },
      req
    });

    res.json(grievance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createGrievance,
  getGrievances,
  resolveGrievance
};
