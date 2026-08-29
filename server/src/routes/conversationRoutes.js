const express = require('express');
const { body } = require('express-validator');
const conversationController = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', conversationController.list);
router.post(
  '/',
  [body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')],
  validate,
  conversationController.create
);
router.get('/:id', conversationController.getById);
router.delete('/:id', conversationController.delete);

module.exports = router;
