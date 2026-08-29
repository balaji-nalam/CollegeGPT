const BaseIntegration = require('./baseIntegration');
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/env');

class GmailIntegration extends BaseIntegration {
  constructor() {
    super('gmail');
  }

  getAuthUrl(state) {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: `${config.CLIENT_URL}/api/integrations/oauth/gmail/callback`,
      client_id: config.GOOGLE_CLIENT_ID || 'mock_google_client_id',
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'].join(' '),
      state: state || '',
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async handleCallback(code) {
    if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
      return {
        accessToken: `mock_gmail_access_token_${Date.now()}`,
        refreshToken: `mock_gmail_refresh_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        scopes: ['gmail.send', 'gmail.readonly'],
      };
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${config.CLIENT_URL}/api/integrations/oauth/gmail/callback`,
      grant_type: 'authorization_code',
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      scopes: response.data.scope?.split(' ') || [],
    };
  }

  async execute(action, params = {}, credentials = {}) {
    const { accessToken } = credentials;

    if (!accessToken) {
      throw new Error('INTEGRATION_NOT_CONNECTED');
    }

    if (action === 'send_email') {
      const { to, subject, body } = params;
      if (!to) throw new Error('Missing recipient (to) parameter for Gmail send_email');

      // If mock token or live API
      if (accessToken.startsWith('mock_')) {
        logger.info(`[Gmail Mock] Email dispatched to ${to}: "${subject}"`);
        return {
          id: `gmail_msg_${Date.now()}`,
          to,
          subject,
          status: 'SENT',
          sentAt: new Date().toISOString(),
        };
      }

      // Real Gmail API call
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject || '').toString('base64')}?=`;
      const messageParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        body || '',
      ];
      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw: encodedMessage },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return {
        id: res.data.id,
        threadId: res.data.threadId,
        status: 'SENT',
        to,
      };
    }

    if (action === 'read_messages') {
      return {
        messages: [
          { id: 'msg_1', from: 'client@example.com', subject: 'New project inquiry', snippet: 'We are looking for automation support.' },
        ],
      };
    }

    throw new Error(`Unsupported Gmail action: ${action}`);
  }
}

module.exports = new GmailIntegration();
