const ProgressReport = require('../models/ProgressReport');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { createNotification, writeAuditLog } = require('../utils/notification');

const requestProgressReport = async (req, res) => {
  try {
    const { teamLeadId, dateRange } = req.body;

    if (!teamLeadId || !dateRange || !dateRange.from || !dateRange.to) {
      return res.status(400).json({ error: 'Team Lead ID and dateRange (from, to) are required.' });
    }

    const orgId = req.user.organization;
    if (!orgId) {
      return res.status(400).json({ error: 'User does not belong to any organization.' });
    }

    // Check if teamLeadId exists
    const leadUser = await User.findById(teamLeadId);
    if (!leadUser) {
      return res.status(404).json({ error: 'Team Lead user not found' });
    }

    const progressReport = new ProgressReport({
      requestedBy: req.user._id,
      teamLeadId,
      dateRange,
      status: 'Requested',
      organization: orgId
    });

    await progressReport.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'PROGRESS_REPORT_REQUESTED',
      targetUserId: leadUser._id,
      details: { dateRange },
      req
    });

    await createNotification({
      recipient: leadUser._id,
      title: 'Progress Report Requested',
      message: `HR has requested a progress report for the period of ${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}.`,
      organization: orgId
    });

    res.status(201).json({ message: 'Progress report requested successfully.', progressReport });
  } catch (error) {
    console.error('Request Progress Report Error:', error);
    res.status(500).json({ error: 'Server error requesting progress report' });
  }
};

const getProgressReports = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const roleName = req.user.role?.name;

    let filter = {};
    if (roleName === 'Team Lead') {
      filter = { teamLeadId: req.user._id };
    } else if (orgId) {
      filter = { organization: orgId };
    }

    const reports = await ProgressReport.find(filter)
      .populate('requestedBy', 'username email')
      .populate('teamLeadId', 'username email')
      .populate('teamLeadReport.taskBreakdown.employeeId', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Get Progress Reports Error:', error);
    res.status(500).json({ error: 'Server error fetching progress reports' });
  }
};

const submitProgressReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { overallProgress, teamSummary, taskBreakdown } = req.body;

    const report = await ProgressReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Progress report request not found' });
    }

    report.teamLeadReport = {
      submittedAt: new Date(),
      overallProgress,
      teamSummary,
      taskBreakdown: taskBreakdown || []
    };
    report.status = 'Submitted';
    await report.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'PROGRESS_REPORT_SUBMITTED',
      targetUserId: report.requestedBy,
      details: { overallProgress },
      req
    });

    // Notify HR requester
    await createNotification({
      recipient: report.requestedBy,
      title: 'Progress Report Submitted',
      message: `Team Lead has submitted the progress report for the requested period.`,
      organization: report.organization
    });

    res.json({ message: 'Progress report submitted successfully.', report });
  } catch (error) {
    console.error('Submit Progress Report Error:', error);
    res.status(500).json({ error: 'Server error submitting progress report' });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comments, actionItems } = req.body;

    const report = await ProgressReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Progress report not found' });
    }

    report.hrFeedback = {
      submittedAt: new Date(),
      rating,
      comments,
      actionItems: actionItems || []
    };
    report.status = 'Reviewed';
    await report.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'PROGRESS_REPORT_REVIEWED',
      targetUserId: report.teamLeadId,
      details: { rating, comments },
      req
    });

    // Notify Team Lead
    await createNotification({
      recipient: report.teamLeadId,
      title: 'Progress Report Feedback Received',
      message: `HR has reviewed your progress report and submitted feedback. Rating: ${rating}/5`,
      organization: report.organization
    });

    res.json({ message: 'Progress report reviewed and feedback submitted.', report });
  } catch (error) {
    console.error('Submit Feedback Error:', error);
    res.status(500).json({ error: 'Server error submitting feedback' });
  }
};

module.exports = {
  requestProgressReport,
  getProgressReports,
  submitProgressReport,
  submitFeedback
};
