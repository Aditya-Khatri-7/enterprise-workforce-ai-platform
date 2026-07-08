const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res) => {
  try {
    const roleName = req.user.role?.name;
    let filter = {};

    if (roleName !== 'Super Admin') {
      filter = { organization: req.user.organization };
    }

    const logs = await AuditLog.find(filter)
      .populate({
        path: 'userRef',
        select: 'username email role',
        populate: {
          path: 'role',
          select: 'name'
        }
      })
      .populate({
        path: 'targetUserRef',
        select: 'username email role',
        populate: {
          path: 'role',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Get Audit Logs Error:', error);
    res.status(500).json({ error: 'Server error fetching audit logs' });
  }
};

module.exports = {
  getAuditLogs
};
