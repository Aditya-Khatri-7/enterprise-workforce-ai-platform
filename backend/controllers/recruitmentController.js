const JobPosting = require('../models/JobPosting');
const Candidate = require('../models/Candidate');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcrypt');
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}
const pdfParse = require('pdf-parse');
const { uploadResume, getResumeDownloadUrl } = require('../utils/cloudinary');
const { screenResumeWithGemini } = require('../utils/geminiScreening');

const extractResumeText = async (buffer, mimetype) => {
  if (mimetype === 'application/pdf') {
    try {
      const data = await pdfParse(buffer);
      return data.text?.slice(0, 8000) || '';
    } catch {
      return '';
    }
  }
  return '';
};

const buildPdfResumeFile = (buffer, fileName) => ({
  mimeType: 'application/pdf',
  base64: buffer.toString('base64'),
  fileName
});

const fetchResumeFileForGemini = async (candidate) => {
  const fileName = candidate.resumeFileName || `${candidate.candidateName}_resume.pdf`;
  if (!fileName.toLowerCase().endsWith('.pdf')) return null;

  const resumeUrl = candidate.resumePublicId
    ? getResumeDownloadUrl(candidate.resumePublicId)
    : candidate.resumeUrl;
  if (!resumeUrl) return null;

  try {
    const response = await fetch(resumeUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return buildPdfResumeFile(Buffer.from(arrayBuffer), fileName);
  } catch (err) {
    console.error('Failed to fetch resume PDF for Gemini:', err.message);
    return null;
  }
};

const runGeminiScreening = async (job, candidateData, resumeText, resumeFile) => {
  try {
    return await screenResumeWithGemini({
      jobTitle: job.title,
      jobDescription: job.description,
      resumeText,
      resumeFile,
      ...candidateData
    });
  } catch (err) {
    console.error('Gemini resume screening failed:', err.message);
    return {
      aiScore: null,
      skillsMatch: [],
      skillsMissing: [],
      strengths: [],
      weaknesses: ['AI screening unavailable — manual review recommended'],
      experienceAnalysis: `${candidateData.experience || 0} years of experience listed.`,
      overallAssessment: 'Gemini resume screening was unavailable. Please review the resume manually or run screening again.',
      recommendation: 'Hold for Review',
      summary: `${candidateData.candidateName} applied for ${job.title}. No Gemini score was generated.`
    };
  }
};

const getJobs = async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) return res.json([]);
    const jobs = await JobPosting.find({ organization: orgId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error('Get Jobs Error:', error);
    res.status(500).json({ error: 'Server error fetching job postings' });
  }
};

const getPublicJobs = async (_req, res) => {
  try {
    const jobs = await JobPosting.find({ status: 'Active' })
      .populate('organization', 'name')
      .sort({ createdAt: -1 })
      .select('title department description status createdAt organization');
    res.json(jobs);
  } catch (error) {
    console.error('Get Public Jobs Error:', error);
    res.status(500).json({ error: 'Server error fetching public job postings' });
  }
};

const getPublicJobById = async (req, res) => {
  try {
    const job = await JobPosting.findOne({ _id: req.params.id, status: 'Active' })
      .populate('organization', 'name')
      .select('title department description status createdAt organization');
    if (!job) return res.status(404).json({ error: 'Job posting not found or no longer active' });
    res.json(job);
  } catch (error) {
    console.error('Get Public Job Error:', error);
    res.status(500).json({ error: 'Server error fetching job posting' });
  }
};

const createJob = async (req, res) => {
  try {
    const { title, department, description } = req.body;
    if (!title || !department || !description) {
      return res.status(400).json({ error: 'Title, department, and description are required' });
    }
    const orgId = req.user.organization;
    const job = new JobPosting({
      title,
      department,
      description,
      organization: orgId
    });
    await job.save();
    res.status(201).json({ message: 'Job posting created successfully', job });
  } catch (error) {
    console.error('Create Job Error:', error);
    res.status(500).json({ error: 'Server error creating job posting' });
  }
};

const getCandidates = async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) return res.json([]);
    const { jobId } = req.query;
    const filter = { organization: orgId };
    if (jobId) filter.jobPosting = jobId;

    const candidates = await Candidate.find(filter)
      .populate('jobPosting', 'title department')
      .sort({ aiScore: -1, createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    console.error('Get Candidates Error:', error);
    res.status(500).json({ error: 'Server error fetching candidates' });
  }
};

const applyToJob = async (req, res) => {
  try {
    const { candidateName, email, experience, skills, phone, coverLetter, jobPostingId } = req.body;

    if (!candidateName || !email || !experience || !jobPostingId) {
      return res.status(400).json({ error: 'Name, email, experience, and job are required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const job = await JobPosting.findOne({ _id: jobPostingId, status: 'Active' });
    if (!job) return res.status(404).json({ error: 'Job posting not found or no longer accepting applications' });

    const existing = await Candidate.findOne({ email, jobPosting: jobPostingId });
    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this position' });
    }

    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadResume(req.file.buffer, req.file.originalname);
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr);
      return res.status(500).json({ error: 'Failed to upload resume. Please try again.' });
    }

    const resumeText = await extractResumeText(req.file.buffer, req.file.mimetype);
    const parsedSkills = Array.isArray(skills)
      ? skills
      : (skills || '').split(',').map(s => s.trim()).filter(Boolean);

    const resumeFileForGemini = req.file.mimetype === 'application/pdf'
      ? buildPdfResumeFile(req.file.buffer, req.file.originalname)
      : null;

    const screening = await runGeminiScreening(
      job,
      { candidateName, email, experience: Number(experience), skills: parsedSkills, phone, coverLetter },
      resumeText,
      resumeFileForGemini
    );

    const candidate = new Candidate({
      candidateName,
      email,
      experience: Number(experience),
      skills: parsedSkills,
      phone,
      coverLetter,
      jobPosting: jobPostingId,
      organization: job.organization,
      resumeUrl: cloudinaryResult.secure_url,
      resumePublicId: cloudinaryResult.public_id,
      resumeFileName: req.file.originalname,
      resumeText,
      status: 'Resume Screening',
      aiScore: screening.aiScore,
      aiReport: {
        skillsMatch: screening.skillsMatch || [],
        skillsMissing: screening.skillsMissing || [],
        strengths: screening.strengths || [],
        weaknesses: screening.weaknesses || [],
        experienceAnalysis: screening.experienceAnalysis || '',
        overallAssessment: screening.overallAssessment || '',
        recommendation: screening.recommendation || '',
        summary: screening.summary || ''
      }
    });

    await candidate.save();
    res.status(201).json({
      message: 'Application submitted successfully! Our HR team will review your profile.',
      candidateId: candidate._id,
      aiScore: candidate.aiScore
    });
  } catch (error) {
    console.error('Apply To Job Error:', error);
    res.status(500).json({ error: 'Server error submitting application' });
  }
};

const createCandidate = async (req, res) => {
  try {
    const { candidateName, email, experience, skills, jobPostingId } = req.body;
    if (!candidateName || !email || !experience || !jobPostingId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const orgId = req.user.organization;
    const job = await JobPosting.findOne({ _id: jobPostingId, organization: orgId });
    if (!job) return res.status(404).json({ error: 'Job posting not found' });

    const parsedSkills = Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean);
    const screening = await runGeminiScreening(
      job,
      { candidateName, email, experience: Number(experience), skills: parsedSkills },
      ''
    );

    const candidate = new Candidate({
      candidateName,
      email,
      experience: Number(experience),
      skills: parsedSkills,
      jobPosting: jobPostingId,
      organization: orgId,
      status: 'Resume Screening',
      aiScore: screening.aiScore,
      aiReport: {
        skillsMatch: screening.skillsMatch || [],
        skillsMissing: screening.skillsMissing || [],
        strengths: screening.strengths || [],
        weaknesses: screening.weaknesses || [],
        experienceAnalysis: screening.experienceAnalysis || '',
        overallAssessment: screening.overallAssessment || '',
        recommendation: screening.recommendation || '',
        summary: screening.summary || ''
      }
    });

    await candidate.save();
    res.status(201).json({ message: 'Candidate registered successfully', candidate });
  } catch (error) {
    console.error('Create Candidate Error:', error);
    res.status(500).json({ error: 'Server error creating candidate' });
  }
};

const rescreenCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.organization;

    const candidate = await Candidate.findOne({ _id: id, organization: orgId }).populate('jobPosting');
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const screening = await runGeminiScreening(
      candidate.jobPosting,
      {
        candidateName: candidate.candidateName,
        email: candidate.email,
        experience: candidate.experience,
        skills: candidate.skills,
        phone: candidate.phone,
        coverLetter: candidate.coverLetter
      },
      candidate.resumeText || '',
      await fetchResumeFileForGemini(candidate)
    );

    candidate.aiScore = screening.aiScore;
    candidate.aiReport = {
      skillsMatch: screening.skillsMatch || [],
      skillsMissing: screening.skillsMissing || [],
      strengths: screening.strengths || [],
      weaknesses: screening.weaknesses || [],
      experienceAnalysis: screening.experienceAnalysis || '',
      overallAssessment: screening.overallAssessment || '',
      recommendation: screening.recommendation || '',
      summary: screening.summary || ''
    };
    await candidate.save();

    res.json({ message: 'AI screening completed', candidate });
  } catch (error) {
    console.error('Rescreen Candidate Error:', error);
    res.status(500).json({ error: 'Server error running AI screening' });
  }
};

const getResumeDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.organization;

    const candidate = await Candidate.findOne({ _id: id, organization: orgId });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    if (!candidate.resumePublicId && !candidate.resumeUrl) {
      return res.status(404).json({ error: 'No resume uploaded for this candidate' });
    }

    const downloadUrl = candidate.resumePublicId
      ? getResumeDownloadUrl(candidate.resumePublicId)
      : candidate.resumeUrl;

    res.json({
      downloadUrl,
      fileName: candidate.resumeFileName || `${candidate.candidateName}_resume.pdf`
    });
  } catch (error) {
    console.error('Get Resume Download Error:', error);
    res.status(500).json({ error: 'Server error fetching resume download link' });
  }
};

const updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orgId = req.user.organization;

    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, organization: orgId },
      { status },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    res.json({ message: `Candidate status updated to ${status}`, candidate });
  } catch (error) {
    console.error('Update Candidate Status Error:', error);
    res.status(500).json({ error: 'Server error updating candidate status' });
  }
};

const hiredToEmployee = async (req, res) => {
  try {
    const { candidateId, department, designation, salary } = req.body;
    const orgId = req.user.organization;

    const candidate = await Candidate.findOne({ _id: candidateId, organization: orgId }).populate('jobPosting');
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    if (candidate.status !== 'Offered' && candidate.status !== 'Hired') {
      return res.status(400).json({ error: 'Candidate must be Offered or Hired status to convert' });
    }

    const existingEmp = await Employee.findOne({ email: candidate.email, organization: orgId });
    if (existingEmp) {
      return res.status(400).json({ error: 'An employee with this email already exists' });
    }

    let employeeId = 'EMP0001';
    const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
    if (lastEmployee) {
      const match = lastEmployee.employeeId.match(/EMP(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1], 10) + 1;
        employeeId = `EMP${String(nextNumber).padStart(4, '0')}`;
      } else {
        const count = await Employee.countDocuments();
        employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
      }
    }

    const parts = candidate.candidateName.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || 'Hired';

    const employee = new Employee({
      employeeId,
      firstName,
      lastName,
      email: candidate.email,
      department: department || candidate.jobPosting?.department || 'Engineering',
      designation: designation || candidate.jobPosting?.title || 'Software Engineer',
      salary: salary || 50000,
      joiningDate: new Date(),
      status: 'Active',
      organization: orgId
    });
    await employee.save();

    const employeeRole = await Role.findOne({ name: 'Employee' });
    const username = (firstName + lastName[0]).toLowerCase() + Math.floor(100 + Math.random() * 900);
    const tempPassword = 'Temp@' + Math.floor(1000 + Math.random() * 9000);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = new User({
      username,
      email: candidate.email,
      password: hashedPassword,
      role: employeeRole._id,
      organization: orgId,
      employeeRef: employee._id,
      mustChangePassword: true
    });
    await newUser.save();

    employee.userRef = newUser._id;
    await employee.save();

    candidate.status = 'Hired';
    await candidate.save();

    res.json({
      message: 'Candidate converted to employee successfully!',
      credentials: { username, temporaryPassword: tempPassword }
    });
  } catch (error) {
    console.error('Convert Hired Error:', error);
    res.status(500).json({ error: 'Server error converting candidate to employee' });
  }
};

module.exports = {
  getJobs,
  getPublicJobs,
  getPublicJobById,
  createJob,
  getCandidates,
  applyToJob,
  createCandidate,
  rescreenCandidate,
  getResumeDownload,
  updateCandidateStatus,
  hiredToEmployee
};
