const Policy = require('../models/Policy');

const createPolicy = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content and category are required' });
    }

    const orgId = req.user.organization;
    if (!orgId) {
      return res.status(400).json({ error: 'You are not associated with any organization' });
    }

    const policy = new Policy({ title, content, category, organization: orgId });
    await policy.save();

    res.status(201).json({ message: 'Policy created successfully', policy });
  } catch (error) {
    console.error('Create Policy Error:', error);
    res.status(500).json({ error: 'Server error creating policy' });
  }
};

const getPolicies = async (req, res) => {
  try {
    const orgId = req.user.role?.name === 'Super Admin' ? req.query.organizationId : req.user.organization;
    if (!orgId) return res.json([]);

    const policies = await Policy.find({ organization: orgId }).sort({ createdAt: -1 });
    res.json(policies);
  } catch (error) {
    console.error('Get Policies Error:', error);
    res.status(500).json({ error: 'Server error fetching policies' });
  }
};

const deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await Policy.findOneAndDelete({ _id: id, organization: req.user.organization });
    if (!policy) return res.status(404).json({ error: 'Policy not found' });
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Delete Policy Error:', error);
    res.status(500).json({ error: 'Server error deleting policy' });
  }
};

module.exports = { createPolicy, getPolicies, deletePolicy };
