const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const notifications = await Notification.find({ recipient: req.user._id, organization: orgId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.organization;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id, organization: orgId },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({ error: 'Server error marking notification read' });
  }
};

const markAllRead = async (req, res) => {
  try {
    const orgId = req.user.organization;
    await Notification.updateMany(
      { recipient: req.user._id, organization: orgId, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    res.status(500).json({ error: 'Server error updating notifications' });
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead
};
