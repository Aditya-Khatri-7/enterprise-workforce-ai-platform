const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetUserRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // e.g. the employee being modified
  ipAddress: { type: String },
  userAgent: { type: String },
  details: { type: String },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
