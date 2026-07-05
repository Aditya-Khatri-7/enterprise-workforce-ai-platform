const JobPosting = require('../models/JobPosting');
const Candidate = require('../models/Candidate');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcrypt');

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
    const candidates = await Candidate.find({ organization: orgId })
      .populate('jobPosting', 'title department')
      .sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    console.error('Get Candidates Error:', error);
    res.status(500).json({ error: 'Server error fetching candidates' });
  }
};

const createCandidate = async (req, res) => {
  try {
    const { candidateName, email, experience, skills, jobPostingId } = req.body;
    if (!candidateName || !email || !experience || !jobPostingId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const orgId = req.user.organization;

    // Simulate AI screening score and analysis report based on keywords
    const matchSkills = ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'CSS', 'HTML', 'Git'];
    const parsedSkills = Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean);
    
    const matched = parsedSkills.filter(s => matchSkills.some(ms => ms.toLowerCase() === s.toLowerCase()));
    const missing = matchSkills.filter(ms => !parsedSkills.some(s => s.toLowerCase() === ms.toLowerCase()));
    
    const aiScore = Math.min(100, Math.max(30, Math.round((matched.length / matchSkills.length) * 100) + (experience * 5)));
    
    const candidate = new Candidate({
      candidateName,
      email,
      experience,
      skills: parsedSkills,
      jobPosting: jobPostingId,
      organization: orgId,
      aiScore,
      aiReport: {
        skillsMatch: matched,
        skillsMissing: missing,
        summary: `${candidateName} has ${experience} years of experience. Matching ${matched.length} key required skills. Recommended status: screening.`
      }
    });

    await candidate.save();
    res.status(201).json({ message: 'Candidate registered successfully', candidate });
  } catch (error) {
    console.error('Create Candidate Error:', error);
    res.status(500).json({ error: 'Server error creating candidate' });
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

    // Ensure Candidate is Offered or Hired before converting
    if (candidate.status !== 'Offered' && candidate.status !== 'Hired') {
      return res.status(400).json({ error: 'Candidate must be Offered or Hired status to convert' });
    }

    // Check if employee already exists with candidate's email
    const existingEmp = await Employee.findOne({ email: candidate.email, organization: orgId });
    if (existingEmp) {
      return res.status(400).json({ error: 'An employee with this email already exists' });
    }

    // Auto-generate employee ID
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

    // Create Employee record
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

    // Create User credentials
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

    // Link user back to employee
    employee.userRef = newUser._id;
    await employee.save();

    // Mark candidate as Hired
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
  createJob,
  getCandidates,
  createCandidate,
  updateCandidateStatus,
  hiredToEmployee
};
