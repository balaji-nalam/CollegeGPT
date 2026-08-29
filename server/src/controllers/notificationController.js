const notificationService = require('../services/notificationService');

const notificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const notifications = await notificationService.getUserNotifications(req.user._id);
      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  },

  markRead: async (req, res, next) => {
    try {
      const updated = await notificationService.markAsRead(req.params.id, req.user._id);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  markAllRead: async (req, res, next) => {
    try {
      await notificationService.markAllAsRead(req.user._id);
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = notificationController;
