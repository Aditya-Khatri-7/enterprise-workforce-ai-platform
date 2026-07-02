const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  category: {
    type: String,
    enum: ['Password Reset', 'Account Lock', 'Technical', 'General'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  }
}, { timestamps: true });

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
