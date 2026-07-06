const mongoose = require('mongoose');

const progressReportSchema = new mongoose.Schema({
  reportId: { type: String },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateRange: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  },
  status: { type: String, enum: ['Requested', 'Submitted', 'Reviewed'], default: 'Requested' },
  teamLeadReport: {
    submittedAt: { type: Date },
    overallProgress: { type: Number },
    teamSummary: { type: String },
    taskBreakdown: [{
      employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      taskName: { type: String },
      completion: { type: Number },
      blockers: { type: String },
      comments: { type: String }
    }]
  },
  hrFeedback: {
    submittedAt: { type: Date },
    rating: { type: Number },
    comments: { type: String },
    actionItems: [{ type: String }]
  },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

module.exports = mongoose.model('ProgressReport', progressReportSchema);
