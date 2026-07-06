const ProjectProposal = require('../models/ProjectProposal');
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const User = require('../models/User');
const { createNotification, writeAuditLog } = require('../utils/notification');

const createProposal = async (req, res) => {
  try {
    const { title, description, estimatedDuration, techStack, expectedOutcome } = req.body;

    if (!title || !description || !estimatedDuration) {
      return res.status(400).json({ error: 'Title, Description, and Estimated Duration are required.' });
    }

    const employee = await Employee.findOne({ userRef: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const proposal = new ProjectProposal({
      employeeId: employee._id,
      title,
      description,
      estimatedDuration,
      techStack: techStack || [],
      expectedOutcome,
      status: 'Submitted',
      organization: req.user.organization
    });

    await proposal.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'PROJECT_PROPOSAL_SUBMITTED',
      targetUserId: req.user._id,
      details: { title },
      req
    });

    // Notify Team Lead / Reporting Manager
    if (employee.reportingManager) {
      const manager = await Employee.findById(employee.reportingManager);
      if (manager && manager.userRef) {
        await createNotification({
          recipient: manager.userRef,
          title: 'Project Proposal Submitted',
          message: `Employee ${employee.firstName} ${employee.lastName} has submitted a new project proposal: "${title}".`,
          organization: req.user.organization
        });
      }
    }

    res.status(201).json({ message: 'Proposal submitted successfully.', proposal });
  } catch (error) {
    console.error('Create Proposal Error:', error);
    res.status(500).json({ error: 'Server error submitting project proposal' });
  }
};

const getProposals = async (req, res) => {
  try {
    const roleName = req.user.role?.name;
    const orgId = req.user.organization;

    let filter = {};

    if (roleName === 'Employee') {
      const employee = await Employee.findOne({ userRef: req.user._id });
      if (!employee) return res.json([]);
      filter = { employeeId: employee._id };
    } else if (roleName === 'Team Lead') {
      const employee = await Employee.findOne({ userRef: req.user._id });
      if (!employee) return res.json([]);

      const teamMembers = await Employee.find({ reportingManager: employee._id }).select('_id');
      const teamMemberIds = teamMembers.map(m => m._id);
      filter = { employeeId: { $in: teamMemberIds } };
    } else if (orgId) {
      filter = { organization: orgId };
    }

    const proposals = await ProjectProposal.find(filter)
      .populate('employeeId', 'firstName lastName employeeId')
      .populate('teamLeadFeedback.approvedProjectId', 'title status dueDate')
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (error) {
    console.error('Get Proposals Error:', error);
    res.status(500).json({ error: 'Server error fetching proposals' });
  }
};

const reviewProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, comments, deadline, priority } = req.body; // decision: "Approve" | "Reject"

    if (!decision || !comments) {
      return res.status(400).json({ error: 'Decision and comments are required.' });
    }

    const proposal = await ProjectProposal.findById(id).populate('employeeId');
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    let approvedProjectId = undefined;

    if (decision === 'Approve') {
      // Create a task dynamically
      const task = new Task({
        title: `Project: ${proposal.title}`,
        description: proposal.description,
        assignedTo: proposal.employeeId._id,
        assignedBy: req.user.employeeRef || null,
        status: 'Pending',
        dueDate: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
        organization: req.user.organization
      });
      await task.save();
      approvedProjectId = task._id;
    }

    proposal.status = decision === 'Approve' ? 'Approved' : 'Rejected';
    proposal.teamLeadFeedback = {
      decision,
      comments,
      approvedProjectId
    };

    await proposal.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'PROJECT_PROPOSAL_REVIEWED',
      targetUserId: proposal.employeeId.userRef,
      details: { decision, comments },
      req
    });

    // Notify employee
    if (proposal.employeeId.userRef) {
      await createNotification({
        recipient: proposal.employeeId.userRef,
        title: `Project Proposal ${decision === 'Approve' ? 'Approved' : 'Rejected'}`,
        message: `Your project proposal "${proposal.title}" has been ${decision === 'Approve' ? 'approved' : 'rejected'}. Comments: ${comments}`,
        organization: req.user.organization
      });
    }

    res.json({ message: `Proposal reviewed with decision: ${decision}`, proposal });
  } catch (error) {
    console.error('Review Proposal Error:', error);
    res.status(500).json({ error: 'Server error reviewing proposal' });
  }
};

module.exports = {
  createProposal,
  getProposals,
  reviewProposal
};
