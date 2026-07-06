const OfficeLocation = require('../models/OfficeLocation');

const createOfficeLocation = async (req, res) => {
  try {
    const { name, address, totalEmployees } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'Office name and address are required' });
    }

    const orgId = req.user.organization;
    if (!orgId) {
      return res.status(400).json({ error: 'You are not associated with any organization' });
    }

    const existing = await OfficeLocation.findOne({ name, organization: orgId });
    if (existing) {
      return res.status(400).json({ error: 'Office location with this name already exists' });
    }

    const office = new OfficeLocation({
      name,
      address,
      totalEmployees: totalEmployees || 0,
      organization: orgId
    });
    await office.save();

    res.status(201).json({ message: 'Office location created successfully', officeLocation: office });
  } catch (error) {
    console.error('Create Office Location Error:', error);
    res.status(500).json({ error: 'Server error creating office location' });
  }
};

const getOfficeLocations = async (req, res) => {
  try {
    const orgId = req.user.role?.name === 'Super Admin' ? req.query.organizationId : req.user.organization;
    if (!orgId) return res.json([]);

    const offices = await OfficeLocation.find({ organization: orgId }).sort({ name: 1 });
    res.json(offices);
  } catch (error) {
    console.error('Get Office Locations Error:', error);
    res.status(500).json({ error: 'Server error fetching office locations' });
  }
};

const deleteOfficeLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await OfficeLocation.findOneAndDelete({ _id: id, organization: req.user.organization });
    if (!office) return res.status(404).json({ error: 'Office location not found' });
    res.json({ message: 'Office location deleted successfully' });
  } catch (error) {
    console.error('Delete Office Location Error:', error);
    res.status(500).json({ error: 'Server error deleting office location' });
  }
};

module.exports = { createOfficeLocation, getOfficeLocations, deleteOfficeLocation };
