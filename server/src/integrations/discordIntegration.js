const BaseIntegration = require('./baseIntegration');
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/env');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  async execute(action, params = {}, credentials = {}) {
    const botToken = credentials.apiKey || credentials.accessToken || config.DISCORD_BOT_TOKEN;

    if (!botToken) {
      throw new Error('INTEGRATION_NOT_CONNECTED');
    }

    if (action === 'send_message') {
      const { channelId, content } = params;
      if (!content) throw new Error('Missing content parameter for Discord send_message');

      if (botToken.startsWith('mock_') || !config.DISCORD_BOT_TOKEN) {
        logger.info(`[Discord Mock] Posted message to channel ${channelId || 'ops'}: "${content}"`);
        return {
          id: `discord_msg_${Date.now()}`,
          channel_id: channelId || 'ops',
          content,
          timestamp: new Date().toISOString(),
        };
      }

      const res = await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        { content },
        {
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return res.data;
    }

    throw new Error(`Unsupported Discord action: ${action}`);
  }
}

module.exports = new DiscordIntegration();
