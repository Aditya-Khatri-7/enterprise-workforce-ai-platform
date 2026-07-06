const mongoose = require('mongoose');

const projectRequestSchema = new mongoose.Schema({
  type: { type: String, enum: ['EmployeeRequest', 'TeamLeadRequest'], required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  teamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  currentProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  requestedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  employeesAgreed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }], // Employees who support this change
  status: { type: String, enum: ['Pending_TL_Approval', 'Pending_Dept_Approval', 'Approved', 'Rejected'], default: 'Pending_TL_Approval' },
  comments: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ProjectRequest', projectRequestSchema);
