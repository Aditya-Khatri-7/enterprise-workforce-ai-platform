const Task = require('../models/Task');
const PerformanceReview = require('../models/PerformanceReview');
const Payroll = require('../models/Payroll');
const AttendanceCorrection = require('../models/AttendanceCorrection');
const Employee = require('../models/Employee');

// ─── TASKS ────────────────────────────────────────────────────────────────────
const getTasks = async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) return res.json([]);
    const tasks = await Task.find({ organization: orgId })
      .populate('assignedTo', 'firstName lastName employeeId')
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate } = req.body;
    if (!title || !assignedTo) {
      return res.status(400).json({ error: 'Title and assignedTo employee are required' });
    }
    const orgId = req.user.organization;
    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user.employeeRef || null,
      dueDate,
      organization: orgId
    });
    await task.save();
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: id, organization: req.user.organization },
      { status },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task status updated', task });
  } catch (error) {
    console.error('Update Task Status Error:', error);
    res.status(500).json({ error: 'Server error updating task status' });
  }
};

// ─── PERFORMANCE REVIEWS ──────────────────────────────────────────────────────
const getReviews = async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) return res.json([]);
    const reviews = await PerformanceReview.find({ organization: orgId })
      .populate('employee', 'firstName lastName employeeId')
      .populate('reviewer', 'username')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Get Reviews Error:', error);
    res.status(500).json({ error: 'Server error fetching reviews' });
  }
};

const createReview = async (req, res) => {
  try {
    const { employee, rating, reviewText } = req.body;
    if (!employee || !rating || !reviewText) {
      return res.status(400).json({ error: 'Employee, rating and review text are required' });
    }
    const orgId = req.user.organization;
    const review = new PerformanceReview({
      employee,
      rating,
      reviewText,
      reviewer: req.user._id,
      organization: orgId
    });
    await review.save();
    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Create Review Error:', error);
    res.status(500).json({ error: 'Server error creating review' });
  }
};

// ─── PAYROLL ──────────────────────────────────────────────────────────────────
const getPayrolls = async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) return res.json([]);
    const payrolls = await Payroll.find({ organization: orgId })
      .populate('employee', 'firstName lastName employeeId email department')
      .sort({ year: -1, month: -1 });
    res.json(payrolls);
  } catch (error) {
    console.error('Get Payrolls Error:', error);
    res.status(500).json({ error: 'Server error fetching payroll records' });
  }
};

const createPayroll = async (req, res) => {
  try {
    const { employee, baseSalary, allowances, deductions, month, year } = req.body;
    if (!employee || !baseSalary || !month || !year) {
      return res.status(400).json({ error: 'Employee, base salary, month and year are required' });
    }
    const orgId = req.user.organization;
    
    // Check if payroll already exists for this employee for the same month and year
    const existing = await Payroll.findOne({ employee, month, year, organization: orgId });
    if (existing) {
      return res.status(400).json({ error: 'Payroll already generated for this month and year' });
    }

    const netSalary = parseFloat(baseSalary) + parseFloat(allowances || 0) - parseFloat(deductions || 0);

    const payroll = new Payroll({
      employee,
      baseSalary,
      allowances,
      deductions,
      netSalary,
      month,
      year,
      organization: orgId
    });
    await payroll.save();
    res.status(201).json({ message: 'Payroll generated successfully', payroll });
  } catch (error) {
    console.error('Create Payroll Error:', error);
    res.status(500).json({ error: 'Server error generating payroll' });
  }
};

const updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const payroll = await Payroll.findOneAndUpdate(
      { _id: id, organization: req.user.organization },
      { status },
      { new: true }
    );
    if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });
    res.json({ message: 'Payroll status updated', payroll });
  } catch (error) {
    console.error('Update Payroll Status Error:', error);
    res.status(500).json({ error: 'Server error updating payroll status' });
  }
};

// ─── ATTENDANCE CORRECTIONS ───────────────────────────────────────────────────
const getCorrections = async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) return res.json([]);
    const corrections = await AttendanceCorrection.find({ organization: orgId })
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ createdAt: -1 });
    res.json(corrections);
  } catch (error) {
    console.error('Get Corrections Error:', error);
    res.status(500).json({ error: 'Server error fetching corrections' });
  }
};

const createCorrection = async (req, res) => {
  try {
    const { date, clockInTime, clockOutTime, reason } = req.body;
    if (!date || !reason) {
      return res.status(400).json({ error: 'Date and reason are required' });
    }
    const orgId = req.user.organization;
    const correction = new AttendanceCorrection({
      employee: req.user.employeeRef,
      date,
      clockInTime,
      clockOutTime,
      reason,
      organization: orgId
    });
    await correction.save();
    res.status(201).json({ message: 'Correction request submitted', correction });
  } catch (error) {
    console.error('Create Correction Error:', error);
    res.status(500).json({ error: 'Server error submitting correction' });
  }
};

const updateCorrectionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const correction = await AttendanceCorrection.findOneAndUpdate(
      { _id: id, organization: req.user.organization },
      { status },
      { new: true }
    );
    if (!correction) return res.status(404).json({ error: 'Correction request not found' });
    res.json({ message: 'Correction status updated', correction });
  } catch (error) {
    console.error('Update Correction Status Error:', error);
    res.status(500).json({ error: 'Server error updating correction status' });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTaskStatus,
  getReviews,
  createReview,
  getPayrolls,
  createPayroll,
  updatePayrollStatus,
  getCorrections,
  createCorrection,
  updateCorrectionStatus
};
