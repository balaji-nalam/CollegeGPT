const BaseIntegration = require('./baseIntegration');
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/env');

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  getAuthUrl(state) {
    const rootUrl = 'https://slack.com/oauth/v2/authorize';
    const options = {
      client_id: config.SLACK_CLIENT_ID || 'mock_slack_client_id',
      scope: ['chat:write', 'channels:read', 'chat:write.public'].join(','),
      redirect_uri: `${config.CLIENT_URL}/api/integrations/oauth/slack/callback`,
      state: state || '',
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async handleCallback(code) {
    if (!config.SLACK_CLIENT_ID || !config.SLACK_CLIENT_SECRET) {
      return {
        accessToken: `mock_slack_bot_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        scopes: ['chat:write', 'channels:read'],
      };
    }

    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        code,
        client_id: config.SLACK_CLIENT_ID,
        client_secret: config.SLACK_CLIENT_SECRET,
        redirect_uri: `${config.CLIENT_URL}/api/integrations/oauth/slack/callback`,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!response.data.ok) {
      throw new Error(`Slack OAuth error: ${response.data.error}`);
    }

    return {
      accessToken: response.data.access_token,
      scopes: response.data.scope?.split(',') || [],
      metadata: {
        team: response.data.team,
        botUserId: response.data.bot_user_id,
      },
    };
  }

  async execute(action, params = {}, credentials = {}) {
    const { accessToken } = credentials;

    if (!accessToken) {
      throw new Error('INTEGRATION_NOT_CONNECTED');
    }

    if (action === 'post_message') {
      const { channel, message } = params;
      if (!message) throw new Error('Missing message text parameter for Slack post_message');

      if (accessToken.startsWith('mock_')) {
        logger.info(`[Slack Mock] Posted message to ${channel || '#general'}: "${message}"`);
        return {
          ok: true,
          channel: channel || '#general',
          ts: String(Date.now() / 1000),
          message: { text: message },
        };
      }

      const res = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channel || '#general',
          text: message,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.data.ok) {
        if (res.data.error === 'token_expired' || res.data.error === 'invalid_auth') {
          throw new Error('AUTH_EXPIRED');
        }
        throw new Error(`Slack API error: ${res.data.error}`);
      }

      return res.data;
    }

    throw new Error(`Unsupported Slack action: ${action}`);
  }
}

module.exports = new SlackIntegration();
