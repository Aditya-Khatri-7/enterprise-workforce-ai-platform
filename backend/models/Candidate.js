const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  skills: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Applied', 'Resume Screening', 'Technical Interview', 'HR Interview', 'Offered', 'Hired', 'Rejected'],
    default: 'Applied'
  },
  phone: {
    type: String
  },
  coverLetter: {
    type: String
  },
  resumeUrl: {
    type: String
  },
  resumePublicId: {
    type: String
  },
  resumeFileName: {
    type: String
  },
  aiScore: {
    type: Number,
    default: 0
  },
  aiReport: {
    skillsMatch: [String],
    skillsMissing: [String],
    strengths: [String],
    weaknesses: [String],
    experienceAnalysis: String,
    overallAssessment: String,
    recommendation: String,
    summary: String
  },
  jobPosting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
