const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'Super Admin',
      'Organization Admin',
      'HR Manager',
      'Manager',
      'Team Lead',
      'Employee',
      'Finance',
      'IT Administrator',
      'Auditor'
    ]
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
