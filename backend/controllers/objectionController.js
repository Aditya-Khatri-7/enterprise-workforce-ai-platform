const WorkObjection = require('../models/WorkObjection');
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const User = require('../models/User');
const { createNotification, writeAuditLog } = require('../utils/notification');

const createObjection = async (req, res) => {
  try {
    const { taskId, reason, alternativePreference } = req.body;

    if (!taskId || !reason) {
      return res.status(400).json({ error: 'Task ID and Reason are required.' });
    }

    const employee = await Employee.findOne({ userRef: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const objection = new WorkObjection({
      employeeId: employee._id,
      taskId,
      reason,
      alternativePreference,
      status: 'Open',
      organization: req.user.organization
    });

    await objection.save();

    await writeAuditLog({
      userId: req.user._id,
      action: 'WORK_OBJECTION_RAISED',
      targetUserId: req.user._id,
      details: { taskId, reason },
      req
    });

    // Notify Team Lead / Reporting Manager
    if (employee.reportingManager) {
      const manager = await Employee.findById(employee.reportingManager);
      if (manager && manager.userRef) {
        await createNotification({
          recipient: manager.userRef,
          title: 'Work Objection Raised',
          message: `Employee ${employee.firstName} ${employee.lastName} has raised an objection to task "${task.title}".`,
          organization: req.user.organization
        });
      }
    }

    res.status(201).json({ message: 'Objection submitted successfully.', objection });
  } catch (error) {
    console.error('Create Objection Error:', error);
    res.status(500).json({ error: 'Server error raising objection' });
  }
};

const getObjections = async (req, res) => {
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

    const objections = await WorkObjection.find(filter)
      .populate('employeeId', 'firstName lastName employeeId')
      .populate('taskId', 'title description status')
      .populate('teamLeadResponse.newTaskId', 'title status')
      .sort({ createdAt: -1 });

    res.json(objections);
  } catch (error) {
    console.error('Get Objections Error:', error);
    res.status(500).json({ error: 'Server error fetching objections' });
  }
};

const resolveObjection = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, comments, newTaskId } = req.body; // decision: "Reassign" | "Reject"

    if (!decision || !comments) {
      return res.status(400).json({ error: 'Decision and comments are required.' });
    }

    const objection = await WorkObjection.findById(id).populate('employeeId');
    if (!objection) {
      return res.status(404).json({ error: 'Objection not found' });
    }

    objection.status = decision === 'Reassign' ? 'Resolved' : 'Rejected';
    objection.teamLeadResponse = {
      decision,
      comments,
      newTaskId: decision === 'Reassign' && newTaskId ? newTaskId : undefined
    };

    await objection.save();

    const originalTask = await Task.findById(objection.taskId);

    if (decision === 'Reassign') {
      // 1. Mark original task as unassigned (remove assignedTo ref)
      if (originalTask) {
        originalTask.assignedTo = undefined;
        await originalTask.save();
      }

      // 2. If new task ID is provided, assign it to the employee
      if (newTaskId) {
        const newTask = await Task.findById(newTaskId);
        if (newTask) {
          newTask.assignedTo = objection.employeeId._id;
          await newTask.save();
        }
      }
    }

    await writeAuditLog({
      userId: req.user._id,
      action: 'WORK_OBJECTION_RESOLVED',
      targetUserId: objection.employeeId.userRef,
      details: { decision, comments },
      req
    });

    // Notify employee
    if (objection.employeeId.userRef) {
      await createNotification({
        recipient: objection.employeeId.userRef,
        title: `Objection ${decision === 'Reassign' ? 'Approved' : 'Rejected'}`,
        message: `Your objection to task "${originalTask ? originalTask.title : 'Task'}" has been ${decision === 'Reassign' ? 'resolved' : 'rejected'}. Comments: ${comments}`,
        organization: req.user.organization
      });
    }

    res.json({ message: `Objection resolved with decision: ${decision}`, objection });
  } catch (error) {
    console.error('Resolve Objection Error:', error);
    res.status(500).json({ error: 'Server error resolving objection' });
  }
};

module.exports = {
  createObjection,
  getObjections,
  resolveObjection
};
