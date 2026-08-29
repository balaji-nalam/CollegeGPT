const Integration = require('../models/Integration');
const encryptionService = require('./encryptionService');
const logger = require('../utils/logger');

// Provider singletons
const providers = {
  gmail: require('../integrations/gmailIntegration'),
  slack: require('../integrations/slackIntegration'),
  discord: require('../integrations/discordIntegration'),
  'google-sheets': require('../integrations/googleSheetsIntegration'),
};

const ALL_PROVIDERS = ['gmail', 'slack', 'discord', 'google-sheets', 'openrouter', 'gemini'];

const integrationService = {
  listUserIntegrations: async (userId) => {
    const existing = await Integration.find({ owner: userId });
    const existingMap = new Map(existing.map((item) => [item.provider, item]));

    // Return complete status list covering all supported providers
    return ALL_PROVIDERS.map((provider) => {
      const item = existingMap.get(provider);
      return {
        provider,
        isConnected: !!item?.isConnected,
        scopes: item?.scopes || [],
        expiresAt: item?.expiresAt || null,
        hasApiKey: !!item?.encryptedApiKey,
        updatedAt: item?.updatedAt || null,
      };
    });
  },

  getProviderStatus: async (userId) => {
    const integrations = await integrationService.listUserIntegrations(userId);
    return {
      total: ALL_PROVIDERS.length,
      connectedCount: integrations.filter((i) => i.isConnected).length,
      providers: integrations,
    };
  },

  getAuthUrl: (provider, state) => {
    const adapter = providers[provider];
    if (!adapter || !adapter.getAuthUrl) {
      throw new Error(`Provider '${provider}' does not support OAuth authentication flow.`);
    }
    return adapter.getAuthUrl(state);
  },

  handleOAuthCallback: async (provider, code, userId) => {
    const adapter = providers[provider];
    if (!adapter || !adapter.handleCallback) {
      throw new Error(`Provider '${provider}' does not support OAuth callbacks.`);
    }

    const tokenData = await adapter.handleCallback(code);

    const encryptedAccessToken = tokenData.accessToken
      ? encryptionService.encrypt(tokenData.accessToken)
      : null;
    const encryptedRefreshToken = tokenData.refreshToken
      ? encryptionService.encrypt(tokenData.refreshToken)
      : null;

    const record = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        isConnected: true,
        scopes: tokenData.scopes || [],
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt: tokenData.expiresAt || null,
        metadata: tokenData.metadata || {},
      },
      { upsert: true, new: true }
    );

    return {
      provider,
      isConnected: true,
      expiresAt: record.expiresAt,
    };
  },

  saveManualCredentials: async (userId, { provider, apiKey, accessToken }) => {
    if (!ALL_PROVIDERS.includes(provider)) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const encryptedApiKey = apiKey ? encryptionService.encrypt(apiKey) : null;
    const encryptedAccessToken = accessToken ? encryptionService.encrypt(accessToken) : null;

    const record = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        isConnected: true,
        encryptedApiKey,
        encryptedAccessToken,
      },
      { upsert: true, new: true }
    );

    return {
      provider,
      isConnected: true,
    };
  },

  disconnectProvider: async (userId, provider) => {
    const record = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        isConnected: false,
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
        encryptedApiKey: null,
      },
      { new: true }
    );
    return { provider, isConnected: false };
  },

  executeAction: async (userId, provider, action, params = {}) => {
    const adapter = providers[provider];
    if (!adapter) {
      throw new Error(`Unknown integration provider: ${provider}`);
    }

    // Look up user credentials
    const record = await Integration.findOne({ owner: userId, provider });
    
    // Decrypt credentials
    const credentials = {
      accessToken: record?.encryptedAccessToken ? encryptionService.decrypt(record.encryptedAccessToken) : null,
      refreshToken: record?.encryptedRefreshToken ? encryptionService.decrypt(record.encryptedRefreshToken) : null,
      apiKey: record?.encryptedApiKey ? encryptionService.decrypt(record.encryptedApiKey) : null,
    };

    // If no credentials saved, allow simulated mock execution in development
    if (!credentials.accessToken && !credentials.apiKey) {
      logger.info(`[Integration Sandbox] No user credentials stored for ${provider}. Simulating in sandbox mode.`);
      credentials.accessToken = `mock_${provider}_token`;
    }

    return adapter.execute(action, params, credentials);
  },
};

module.exports = integrationService;
