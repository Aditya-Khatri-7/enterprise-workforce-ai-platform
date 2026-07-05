const Request = require('../models/Request');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const LeaveRequest = require('../models/LeaveRequest');
const Asset = require('../models/Asset');
const AuditLog = require('../models/AuditLog');

const createRequest = async (req, res) => {
  try {
    const { requestType, targetUserId, previousValues, newValues, remarks, priority } = req.body;
    if (!requestType || !newValues) {
      return res.status(400).json({ error: 'Request type and new values are required' });
    }

    const orgId = req.user.organization;
    
    // Assign high priority to security or profile activation items
    let calcPriority = priority || 'Medium';
    if (requestType === 'Account Activation Request' || requestType === 'Role Change Request') {
      calcPriority = 'High';
    }

    const request = new Request({
      requestType,
      requester: req.user._id,
      targetUser: targetUserId || req.user._id,
      organization: orgId,
      priority: calcPriority,
      previousValues,
      newValues,
      remarks,
      timeline: [{
        status: 'Pending',
        actor: req.user._id,
        remarks: remarks || 'Request submitted.'
      }]
    });

    await request.save();

    await AuditLog.create({
      action: 'USER_CREATED', // map to general creations in enum
      userRef: req.user._id,
      targetUserRef: targetUserId || req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Created request ID: ${request._id} (${requestType})`
    });

    res.status(201).json({ message: 'Request submitted successfully', request });
  } catch (error) {
    console.error('Create Request Error:', error);
    res.status(500).json({ error: 'Server error creating request' });
  }
};

const getRequests = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const roleName = req.user.role?.name;

    let filter = {};

    if (roleName === 'Super Admin') {
      // Super Admin sees all requests
      filter = {};
    } else if (roleName === 'Organization Admin') {
      // Org Admin sees all requests under their organization
      filter = { organization: orgId };
    } else if (roleName === 'Manager') {
      // Manager sees requests in their department or from their team
      const team = await Employee.find({ department: req.user.employeeRef?.department }).select('userRef').lean();
      const teamUserIds = team.map(t => t.userRef).filter(Boolean);
      filter = { 
        $or: [
          { requester: req.user._id },
          { requester: { $in: teamUserIds } }
        ],
        organization: orgId
      };
    } else {
      // Regular user sees only their own requests
      filter = { requester: req.user._id, organization: orgId };
    }

    const requests = await Request.find(filter)
      .populate('requester', 'username email')
      .populate('targetUser', 'username email')
      .populate('approver', 'username email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get Requests Error:', error);
    res.status(500).json({ error: 'Server error fetching requests' });
  }
};

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.organization;
    const roleName = req.user.role?.name;

    let filter = { _id: id };
    if (roleName !== 'Super Admin' && roleName !== 'Organization Admin') {
      filter.organization = orgId;
    }

    const request = await Request.findOne(filter)
      .populate('requester', 'username email')
      .populate('targetUser', 'username email')
      .populate('approver', 'username email')
      .populate('comments.user', 'username email')
      .populate('timeline.actor', 'username email');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Get Request Detail Error:', error);
    res.status(500).json({ error: 'Server error retrieving request details' });
  }
};

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.comments.push({
      user: req.user._id,
      text
    });

    await request.save();
    res.status(201).json({ message: 'Comment added', request });
  } catch (error) {
    console.error('Add Comment Error:', error);
    res.status(500).json({ error: 'Server error adding comment' });
  }
};

const takeRequestAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // Approved, Rejected, Returned for Changes
    if (!['Approved', 'Rejected', 'Returned for Changes'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status action specified' });
    }

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.status = status;
    request.approver = req.user._id;
    request.remarks = remarks || '';
    request.timeline.push({
      status,
      actor: req.user._id,
      remarks: remarks || `Request status set to ${status}.`
    });

    // If Approved, apply mutations to actual database collections
    if (status === 'Approved') {
      const { targetUser, requestType, newValues } = request;

      if (requestType === 'Profile Edit Request') {
        // Find employee associated with targetUser
        await Employee.findOneAndUpdate({ userRef: targetUser }, newValues, { new: true });
        if (newValues.email) {
          await User.findByIdAndUpdate(targetUser, { email: newValues.email });
        }
      } else if (requestType === 'Account Activation Request') {
        await User.findByIdAndUpdate(targetUser, { isActive: true, isLocked: false, failedLoginAttempts: 0 });
      } else if (requestType === 'Role Change Request') {
        const roleObj = await Role.findOne({ name: newValues.roleName });
        if (roleObj) {
          await User.findByIdAndUpdate(targetUser, { role: roleObj._id });
        }
      } else if (requestType === 'Department Transfer') {
        await Employee.findOneAndUpdate({ userRef: targetUser }, { department: newValues.department });
      } else if (requestType === 'Manager Change') {
        await Employee.findOneAndUpdate({ userRef: targetUser }, { reportingManager: newValues.reportingManager });
      } else if (requestType === 'Salary Revision') {
        await Employee.findOneAndUpdate({ userRef: targetUser }, { salary: newValues.salary });
      } else if (requestType === 'Employee Promotion') {
        await Employee.findOneAndUpdate({ userRef: targetUser }, { designation: newValues.designation, salary: newValues.salary });
      } else if (requestType === 'Asset Request') {
        await Asset.findByIdAndUpdate(newValues.assetId, { assignedTo: newValues.employeeId, status: 'Assigned' });
      } else if (requestType === 'Leave Request') {
        if (newValues.leaveRequestId) {
          await LeaveRequest.findByIdAndUpdate(newValues.leaveRequestId, { status: 'Approved' });
        }
      }
    }

    await request.save();

    await AuditLog.create({
      action: 'USER_STATUS_UPDATED',
      userRef: req.user._id,
      targetUserRef: request.targetUser,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Request action: ${status} for Request ID: ${request._id}`
    });

    res.json({ message: `Request has been ${status.toLowerCase()} successfully`, request });
  } catch (error) {
    console.error('Take Request Action Error:', error);
    res.status(500).json({ error: 'Server error processing request action' });
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  addComment,
  takeRequestAction
};
