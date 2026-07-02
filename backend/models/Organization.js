const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  organizationId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  address: {
    type: String,
    trim: true
  },
  subscriptionPlan: {
    type: String,
    enum: ['Basic', 'Premium', 'Enterprise'],
    default: 'Basic'
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended', 'Deleted'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
