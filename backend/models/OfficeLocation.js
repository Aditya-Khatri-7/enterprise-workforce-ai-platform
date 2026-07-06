const mongoose = require('mongoose');

const officeLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  totalEmployees: {
    type: Number,
    default: 0
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, { timestamps: true });

officeLocationSchema.index({ name: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model('OfficeLocation', officeLocationSchema);
