const mongoose = require('mongoose');

const teamRequestSchema = new mongoose.Schema({
  type: { type: String, enum: ['MoveTeam', 'ChangeTeamLead'], required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Only for 'MoveTeam'
  currentTeamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  requestedTeamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employeesAgreed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }], // Only for 'ChangeTeamLead'
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  comments: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TeamRequest', teamRequestSchema);
