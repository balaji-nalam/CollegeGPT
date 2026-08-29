const logger = require('../utils/logger');

class ValidationAgent {
  constructor() {
    this.name = 'validation';
  }

  validate(executionResult, step) {
    const { nodeId, nodeType, provider, action } = step;
    const { success, output, error } = executionResult;

    if (!success || error) {
      return {
        isValid: false,
        nodeId,
        reason: error?.message || 'Execution marked as unsuccessful',
        missingFields: [],
      };
    }

    if (!output || typeof output !== 'object') {
      return {
        isValid: false,
        nodeId,
        reason: 'Output payload is null or not a valid object.',
        missingFields: ['output'],
      };
    }

    const missingFields = [];

    // Verify expected fields by provider / node type
    if (nodeType === 'actionNode') {
      if (provider === 'gmail' && action === 'send_email') {
        if (!output.id && !output.status) missingFields.push('id', 'status');
      } else if (provider === 'slack' && action === 'post_message') {
        if (!output.ok && !output.message) missingFields.push('ok');
      } else if (provider === 'discord' && action === 'send_message') {
        if (!output.id && !output.content) missingFields.push('id');
      } else if (provider === 'google-sheets' && action === 'append_row') {
        if (!output.updates && !output.spreadsheetId) missingFields.push('updates');
      }
    } else if (nodeType === 'aiNode') {
      if (!output.summary && !output.result && !output.text) {
        missingFields.push('summary|result|text');
      }
    }

    if (missingFields.length > 0) {
      logger.agent(this.name, null, `Validation warning for ${nodeId}: missing required fields [${missingFields.join(', ')}]`);
      return {
        isValid: false,
        nodeId,
        reason: `Missing required output fields: ${missingFields.join(', ')}`,
        missingFields,
      };
    }

    return {
      isValid: true,
      nodeId,
      message: 'Validation passed successfully.',
    };
  }
}

module.exports = new ValidationAgent();
