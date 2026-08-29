const express = require('express');
const { body } = require('express-validator');
const integrationController = require('../controllers/integrationController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// OAuth callback is unauthenticated because user redirects from external OAuth provider
router.get('/oauth/:provider/callback', integrationController.handleCallback);
router.get('/oauth/error', integrationController.oauthError);

// Protected routes
router.use(protect);

router.get('/', integrationController.listIntegrations);
router.get('/status', integrationController.getStatus);
router.get('/oauth/:provider/start', integrationController.startOAuth);

router.post(
  '/',
  [
    body('provider').notEmpty().withMessage('Provider is required'),
    body('apiKey').optional().isString(),
    body('accessToken').optional().isString(),
  ],
  validate,
  integrationController.saveCredentials
);

router.delete('/:provider', integrationController.disconnect);

module.exports = router;
