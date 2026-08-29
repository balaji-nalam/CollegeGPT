const BaseIntegration = require('./baseIntegration');
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/env');

class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  getAuthUrl(state) {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: `${config.CLIENT_URL}/api/integrations/oauth/google-sheets/callback`,
      client_id: config.GOOGLE_CLIENT_ID || 'mock_google_client_id',
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/spreadsheets'].join(' '),
      state: state || '',
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async execute(action, params = {}, credentials = {}) {
    const { accessToken } = credentials;

    if (!accessToken) {
      throw new Error('INTEGRATION_NOT_CONNECTED');
    }

    if (action === 'append_row') {
      const { spreadsheetId, range = 'Sheet1!A:E', values } = params;

      const rowValues = values || [
        new Date().toISOString(),
        params.name || 'Lead',
        params.email || 'lead@example.com',
        params.status || 'NEW',
      ];

      if (accessToken.startsWith('mock_')) {
        logger.info(`[Google Sheets Mock] Appended row to sheet ${spreadsheetId}:`, rowValues);
        return {
          spreadsheetId,
          tableRange: range,
          updates: {
            updatedRange: `${range.split('!')[0]}!A2:D2`,
            updatedRows: 1,
            updatedColumns: rowValues.length,
            updatedCells: rowValues.length,
          },
        };
      }

      const res = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
        { values: [rowValues] },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return res.data;
    }

    if (action === 'read_range') {
      return {
        values: [
          ['Timestamp', 'Name', 'Email', 'Status'],
          [new Date().toISOString(), 'Alice Smith', 'alice@acme.com', 'QUALIFIED'],
        ],
      };
    }

    throw new Error(`Unsupported Google Sheets action: ${action}`);
  }
}

module.exports = new GoogleSheetsIntegration();
