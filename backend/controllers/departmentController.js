const Department = require('../models/Department');

const createDepartment = async (req, res) => {
  try {
    const { name, code, manager } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required' });
    }

    const orgId = req.user.organization;
    if (!orgId) {
      return res.status(400).json({ error: 'You are not associated with any organization' });
    }

    const existing = await Department.findOne({ name, organization: orgId });
    if (existing) {
      return res.status(400).json({ error: 'Department with this name already exists in your organization' });
    }

    const dept = new Department({ name, code: code.toUpperCase(), organization: orgId, manager: manager || null });
    await dept.save();

    res.status(201).json({ message: 'Department created successfully', department: dept });
  } catch (error) {
    console.error('Create Department Error:', error);
    res.status(500).json({ error: 'Server error creating department' });
  }
};

const getDepartments = async (req, res) => {
  try {
    const orgId = req.user.role?.name === 'Super Admin' ? req.query.organizationId : req.user.organization;
    if (!orgId) return res.json([]);

    const departments = await Department.find({ organization: orgId }).populate('manager', 'firstName lastName').sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    console.error('Get Departments Error:', error);
    res.status(500).json({ error: 'Server error fetching departments' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findOneAndDelete({ _id: id, organization: req.user.organization });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete Department Error:', error);
    res.status(500).json({ error: 'Server error deleting department' });
  }
};

module.exports = { createDepartment, getDepartments, deleteDepartment };
