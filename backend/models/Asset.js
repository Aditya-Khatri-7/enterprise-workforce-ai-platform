const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetName: {
    type: String,
    required: true
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['Laptop', 'Mobile', 'Monitor', 'Accessories', 'Other'],
    default: 'Laptop'
  },
  cost: {
    type: Number,
    default: 0
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  status: {
    type: String,
    enum: ['Available', 'Assigned', 'Under Repair', 'Retired'],
    default: 'Available'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);
