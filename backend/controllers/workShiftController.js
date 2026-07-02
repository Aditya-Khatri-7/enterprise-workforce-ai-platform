const WorkShift = require('../models/WorkShift');

const createWorkShift = async (req, res) => {
  try {
    const { name, startTime, endTime } = req.body;
    if (!name || !startTime || !endTime) {
      return res.status(400).json({ error: 'Name, startTime and endTime are required' });
    }

    const orgId = req.user.organization;
    if (!orgId) {
      return res.status(400).json({ error: 'You are not associated with any organization' });
    }

    const existing = await WorkShift.findOne({ name, organization: orgId });
    if (existing) {
      return res.status(400).json({ error: 'Work Shift with this name already exists in your organization' });
    }

    const shift = new WorkShift({ name, startTime, endTime, organization: orgId });
    await shift.save();

    res.status(201).json({ message: 'Work Shift created successfully', workShift: shift });
  } catch (error) {
    console.error('Create Work Shift Error:', error);
    res.status(500).json({ error: 'Server error creating work shift' });
  }
};

const getWorkShifts = async (req, res) => {
  try {
    const orgId = req.user.role?.name === 'Super Admin' ? req.query.organizationId : req.user.organization;
    if (!orgId) return res.json([]);

    const shifts = await WorkShift.find({ organization: orgId }).sort({ name: 1 });
    res.json(shifts);
  } catch (error) {
    console.error('Get Work Shifts Error:', error);
    res.status(500).json({ error: 'Server error fetching work shifts' });
  }
};

const deleteWorkShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await WorkShift.findOneAndDelete({ _id: id, organization: req.user.organization });
    if (!shift) return res.status(404).json({ error: 'Work Shift not found' });
    res.json({ message: 'Work Shift deleted successfully' });
  } catch (error) {
    console.error('Delete Work Shift Error:', error);
    res.status(500).json({ error: 'Server error deleting work shift' });
  }
};

module.exports = { createWorkShift, getWorkShifts, deleteWorkShift };
