const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  dob: { type: Date },
  mobile: { type: String },
  email: { type: String, required: true, unique: true },
  address: { type: String },
  bloodGroup: { type: String },
  
  department: { type: String, required: true },
  designation: { type: String, required: true },
  reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  joiningDate: { type: Date, required: true },
  employmentType: { type: String, enum: ['Full-Time', 'Part-Time', 'Contract'] },
  status: { type: String, enum: ['Active', 'On Leave', 'Terminated', 'Archived'], default: 'Active' },
  
  profileImage: { type: String },
  emergencyContact: { type: String, trim: true },
  skills: [{ type: String, trim: true }],
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resumeText: { type: String },
  resumeFileName: { type: String },
  resumeFileBase64: { type: String },
  ratings: {
    teamLeadRating: { type: Number, default: 0 },
    managerRating: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
