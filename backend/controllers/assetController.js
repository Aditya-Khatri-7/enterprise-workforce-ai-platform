const Asset = require('../models/Asset');
const Employee = require('../models/Employee');

const getAssets = async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) return res.json([]);
    const assets = await Asset.find({ organization: orgId })
      .populate('assignedTo', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    console.error('Get Assets Error:', error);
    res.status(500).json({ error: 'Server error fetching asset inventory' });
  }
};

const createAsset = async (req, res) => {
  try {
    const { assetName, serialNumber, type, cost } = req.body;
    if (!assetName || !serialNumber) {
      return res.status(400).json({ error: 'Asset Name and Serial Number are required' });
    }
    const orgId = req.user.organization;
    
    const existing = await Asset.findOne({ serialNumber, organization: orgId });
    if (existing) {
      return res.status(400).json({ error: 'Asset with this Serial Number already exists' });
    }

    const asset = new Asset({
      assetName,
      serialNumber,
      type,
      cost,
      organization: orgId
    });
    await asset.save();
    res.status(201).json({ message: 'Asset created successfully', asset });
  } catch (error) {
    console.error('Create Asset Error:', error);
    res.status(500).json({ error: 'Server error creating asset' });
  }
};

const assignAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body; // DB ObjectId of employee or null to unassign
    const orgId = req.user.organization;

    let targetEmployee = null;
    let status = 'Available';

    if (employeeId) {
      targetEmployee = await Employee.findOne({ _id: employeeId, organization: orgId });
      if (!targetEmployee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      status = 'Assigned';
    }

    const asset = await Asset.findOneAndUpdate(
      { _id: id, organization: orgId },
      { assignedTo: targetEmployee ? targetEmployee._id : null, status },
      { new: true }
    );
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    res.json({ message: targetEmployee ? `Asset assigned to ${targetEmployee.firstName}` : 'Asset unassigned successfully', asset });
  } catch (error) {
    console.error('Assign Asset Error:', error);
    res.status(500).json({ error: 'Server error allocating asset' });
  }
};

const updateAssetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, type, cost, assetName } = req.body;
    const orgId = req.user.organization;

    const updateObj = {};
    if (status) updateObj.status = status;
    if (type) updateObj.type = type;
    if (cost) updateObj.cost = cost;
    if (assetName) updateObj.assetName = assetName;

    const asset = await Asset.findOneAndUpdate(
      { _id: id, organization: orgId },
      updateObj,
      { new: true }
    );
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    res.json({ message: 'Asset updated successfully', asset });
  } catch (error) {
    console.error('Update Asset Error:', error);
    res.status(500).json({ error: 'Server error updating asset details' });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.organization;
    const asset = await Asset.findOneAndDelete({ _id: id, organization: orgId });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete Asset Error:', error);
    res.status(500).json({ error: 'Server error deleting asset' });
  }
};

module.exports = {
  getAssets,
  createAsset,
  assignAsset,
  updateAssetStatus,
  deleteAsset
};
