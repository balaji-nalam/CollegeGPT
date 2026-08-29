const chatService = require('../services/chatService');

const chatController = {
  sendMessage: async (req, res, next) => {
    try {
      const { conversationId, message, options } = req.body;
      const result = await chatService.sendMessage({
        userId: req.user.id,
        conversationId,
        messageText: message,
        options,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = chatController;
