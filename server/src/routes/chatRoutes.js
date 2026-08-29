const express = require('express');
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('message').trim().notEmpty().withMessage('Message cannot be empty'),
    body('conversationId').optional().isUUID().withMessage('Invalid conversation ID format'),
  ],
  validate,
  chatController.sendMessage
);

module.exports = router;
