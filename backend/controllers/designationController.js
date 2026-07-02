const Designation = require('../models/Designation');

const createDesignation = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Designation name and code are required' });
    }

    const orgId = req.user.organization;
    if (!orgId) {
      return res.status(400).json({ error: 'You are not associated with any organization' });
    }

    const existing = await Designation.findOne({ name, organization: orgId });
    if (existing) {
      return res.status(400).json({ error: 'Designation with this name already exists in your organization' });
    }

    const desig = new Designation({ name, code: code.toUpperCase(), organization: orgId });
    await desig.save();

    res.status(201).json({ message: 'Designation created successfully', designation: desig });
  } catch (error) {
    console.error('Create Designation Error:', error);
    res.status(500).json({ error: 'Server error creating designation' });
  }
};

const getDesignations = async (req, res) => {
  try {
    const orgId = req.user.role?.name === 'Super Admin' ? req.query.organizationId : req.user.organization;
    if (!orgId) return res.json([]);

    const designations = await Designation.find({ organization: orgId }).sort({ name: 1 });
    res.json(designations);
  } catch (error) {
    console.error('Get Designations Error:', error);
    res.status(500).json({ error: 'Server error fetching designations' });
  }
};

const deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const desig = await Designation.findOneAndDelete({ _id: id, organization: req.user.organization });
    if (!desig) return res.status(404).json({ error: 'Designation not found' });
    res.json({ message: 'Designation deleted successfully' });
  } catch (error) {
    console.error('Delete Designation Error:', error);
    res.status(500).json({ error: 'Server error deleting designation' });
  }
};

module.exports = { createDesignation, getDesignations, deleteDesignation };
