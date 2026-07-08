const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { emitToUser } = require('./socket');

/**
 * Creates a notification in DB and emits it in real-time via Socket.IO
 */
const createNotification = async ({ recipient, title, message, organization }) => {
  try {
    const notification = new Notification({
      recipient,
      title,
      message,
      organization: organization || null
    });
    await notification.save();

    // Emit via Socket.IO
    emitToUser(recipient.toString(), 'notification', notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Creates an Audit Log entry in DB
 */
const writeAuditLog = async ({ userId, action, targetUserId, details, req, organization }) => {
  try {
    const ipAddress = req ? req.ip : '127.0.0.1';
    const userAgent = req ? req.headers['user-agent'] : 'System';

    let orgId = organization || req?.user?.organization || null;
    if (!orgId && userId) {
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (user) {
        orgId = user.organization;
      }
    }

    await AuditLog.create({
      action,
      userRef: userId || null,
      targetUserRef: targetUserId || null,
      ipAddress,
      userAgent,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      organization: orgId
    });
  } catch (error) {
    console.error('Error writing audit log:', error);
  }
};

module.exports = {
  createNotification,
  writeAuditLog
};
