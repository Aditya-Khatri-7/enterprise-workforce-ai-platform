const mongoose = require('mongoose');

const projectProposalSchema = new mongoose.Schema({
  proposalId: { type: String },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  estimatedDuration: { type: String, required: true },
  techStack: [{ type: String }],
  expectedOutcome: { type: String },
  status: { type: String, enum: ['Submitted', 'UnderReview', 'Approved', 'Rejected'], default: 'Submitted' },
  teamLeadFeedback: {
    comments: { type: String },
    decision: { type: String, enum: ['Approve', 'Reject'] },
    approvedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }
  },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

module.exports = mongoose.model('ProjectProposal', projectProposalSchema);
