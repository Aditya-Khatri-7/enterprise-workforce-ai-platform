const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Closed'],
    default: 'Active'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('JobPosting', jobPostingSchema);
