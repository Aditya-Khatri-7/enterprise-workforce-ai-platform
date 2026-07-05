const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requestType: {
    type: String,
    required: true,
    enum: [
      'Profile Edit Request',
      'Account Activation Request',
      'Leave Request',
      'Role Change Request',
      'Department Transfer',
      'Manager Change',
      'Salary Revision',
      'Employee Promotion',
      'Asset Request',
      'Organization Creation',
      'Admin Creation',
      'Document Approval'
    ]
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Returned for Changes'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  previousValues: {
    type: mongoose.Schema.Types.Mixed
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed
  },
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: {
    type: String
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    status: {
      type: String,
      required: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actionDate: {
      type: Date,
      default: Date.now
    },
    remarks: {
      type: String
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
