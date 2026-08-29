const Notification = require('../models/Notification');

const notificationService = {
  getUserNotifications: async (userId) => {
    return Notification.find({ owner: userId }).sort({ createdAt: -1 }).limit(50);
  },

  markAsRead: async (id, userId) => {
    return Notification.findOneAndUpdate({ _id: id, owner: userId }, { isRead: true }, { new: true });
  },

  markAllAsRead: async (userId) => {
    await Notification.updateMany({ owner: userId, isRead: false }, { isRead: true });
    return { success: true };
  },
};

module.exports = notificationService;
