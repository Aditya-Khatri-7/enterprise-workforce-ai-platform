const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'FAILED_LOGIN', 
      'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'EMPLOYEE_ARCHIVED'
    ]
  },
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetUserRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // e.g. the employee being modified
  ipAddress: { type: String },
  userAgent: { type: String },
  details: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
