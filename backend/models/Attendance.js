const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true
  },
  clockIn: {
    type: String, // format HH:MM
    required: true
  },
  clockOut: {
    type: String // format HH:MM
  },
  workingHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Work From Home'],
    default: 'Present'
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, { timestamps: true });

// Ensure unique composite index for one record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
