const integrationService = require('../services/integrationService');
const config = require('../config/env');

const integrationController = {
  listIntegrations: async (req, res, next) => {
    try {
      const integrations = await integrationService.listUserIntegrations(req.user._id);
      res.status(200).json({
        success: true,
        data: integrations,
      });
    } catch (error) {
      next(error);
    }
  },

  getStatus: async (req, res, next) => {
    try {
      const status = await integrationService.getProviderStatus(req.user._id);
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  },

  startOAuth: async (req, res, next) => {
    try {
      const { provider } = req.params;
      const state = Buffer.from(JSON.stringify({ userId: req.user._id, provider })).toString('base64');
      const url = integrationService.getAuthUrl(provider, state);
      res.status(200).json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  },

  handleCallback: async (req, res, next) => {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;

      let userId = req.user?._id;
      if (!userId && state) {
        try {
          const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
          userId = parsed.userId;
        } catch (e) {}
      }

      if (!userId) {
        return res.redirect(`${config.CLIENT_URL}/integrations?status=error&message=Unauthenticated`);
      }

      await integrationService.handleOAuthCallback(provider, code, userId);
      res.redirect(`${config.CLIENT_URL}/integrations?status=success&provider=${provider}`);
    } catch (error) {
      res.redirect(`${config.CLIENT_URL}/integrations?status=error&message=${encodeURIComponent(error.message)}`);
    }
  },

  oauthError: (req, res) => {
    res.status(400).json({
      success: false,
      message: 'OAuth authorization was cancelled or failed.',
    });
  },

  saveCredentials: async (req, res, next) => {
    try {
      const { provider, apiKey, accessToken } = req.body;
      const result = await integrationService.saveManualCredentials(req.user._id, {
        provider,
        apiKey,
        accessToken,
      });
      res.status(200).json({
        success: true,
        message: `${provider} credentials saved successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  disconnect: async (req, res, next) => {
    try {
      const { provider } = req.params;
      const result = await integrationService.disconnectProvider(req.user._id, provider);
      res.status(200).json({
        success: true,
        message: `${provider} disconnected`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = integrationController;
