const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate({
        path: 'userRef',
        select: 'username email'
      })
      .populate({
        path: 'targetUserRef',
        select: 'username email'
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
