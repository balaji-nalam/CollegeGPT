const express = require('express');
const { body } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All workflow routes require authentication
router.use(protect);

router.get('/dashboard', workflowController.getDashboardStats);
router.get('/', workflowController.listWorkflows);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Workflow name is required'),
    body('nodes').optional().isArray().withMessage('Nodes must be an array'),
    body('edges').optional().isArray().withMessage('Edges must be an array'),
  ],
  validate,
  workflowController.createWorkflow
);

// Route for AI Prompt Generation (handled in Phase 3)
let aiController;
try {
  aiController = require('../controllers/aiController');
  if (aiController && aiController.generateWorkflow) {
    router.post('/generate', aiController.generateWorkflow);
  }
} catch (e) {}

// Execution trigger route (handled in Phase 4)
let executionController;
try {
  executionController = require('../controllers/executionController');
  if (executionController && executionController.triggerWorkflow) {
    router.post('/:id/execute', executionController.triggerWorkflow);
  }
} catch (e) {}

router.get('/:id', workflowController.getWorkflowById);
router.put('/:id', workflowController.updateWorkflow);
router.post('/:id/duplicate', workflowController.duplicateWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);

module.exports = router;
