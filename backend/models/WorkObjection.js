const mongoose = require('mongoose');

const workObjectionSchema = new mongoose.Schema({
  objectionId: { type: String },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  reason: { type: String, required: true },
  alternativePreference: { type: String },
  status: { type: String, enum: ['Open', 'UnderReview', 'Resolved', 'Rejected'], default: 'Open' },
  teamLeadResponse: {
    decision: { type: String, enum: ['Reassign', 'Reject'] },
    comments: { type: String },
    newTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }
  },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

module.exports = mongoose.model('WorkObjection', workObjectionSchema);
