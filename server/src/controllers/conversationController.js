const chatService = require('../services/chatService');

const conversationController = {
  list: async (req, res, next) => {
    try {
      const conversations = await chatService.listUserConversations(req.user.id);
      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { title } = req.body;
      const convId = await chatService.createConversation(req.user.id, title || 'New Conversation');
      res.status(201).json({
        success: true,
        data: { id: convId, title: title || 'New Conversation' },
      });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const result = await chatService.getConversationDetails(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const result = await chatService.deleteConversation(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = conversationController;
