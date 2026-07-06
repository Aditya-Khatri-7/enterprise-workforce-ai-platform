const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  department: { type: String, required: true }, // e.g. "Engineering"
  assignedTeamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Currently assigned Team Lead
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }], // Employees on this project
  status: { type: String, enum: ['Ongoing', 'Completed'], default: 'Ongoing' },
  pendingAgreement: { type: Boolean, default: false }, // True if newly assigned by Dept Manager and waiting for employees' agreement
  agreedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }], // Employees who agreed to the new project
  tlAcceptedStatus: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }, // Team Lead acceptance status
  rejectedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }] // Employees who rejected the project assignment
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
