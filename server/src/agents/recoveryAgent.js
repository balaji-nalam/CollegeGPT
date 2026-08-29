const logger = require('../utils/logger');

const FAILURE_TAXONOMY = {
  MISSING_FIELDS: 'MISSING_FIELDS',
  API_FAILURE: 'API_FAILURE',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  RATE_LIMIT: 'RATE_LIMIT',
  TRANSIENT: 'TRANSIENT',
};

class RecoveryAgent {
  constructor() {
    this.name = 'recovery';
    this.maxRetries = 3;
    this.initialBackoffMs = 500;
  }

  classifyFailure(error, validationResult) {
    const errorMsg = (error?.message || validationResult?.reason || '').toLowerCase();
    const errorCode = error?.code || '';

    if (validationResult?.missingFields?.length > 0) {
      return FAILURE_TAXONOMY.MISSING_FIELDS;
    }

    if (errorMsg.includes('auth') || errorMsg.includes('token') || errorMsg.includes('unauthorized') || errorCode === 'AUTH_EXPIRED') {
      return FAILURE_TAXONOMY.AUTH_EXPIRED;
    }

    if (errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('quota')) {
      return FAILURE_TAXONOMY.RATE_LIMIT;
    }

    if (errorMsg.includes('timeout') || errorMsg.includes('econnreset') || errorMsg.includes('econnrefused') || errorMsg.includes('503')) {
      return FAILURE_TAXONOMY.TRANSIENT;
    }

    return FAILURE_TAXONOMY.API_FAILURE;
  }

  evaluate(failureContext) {
    const { error, validationResult, currentRetryCount = 0, nodeId } = failureContext;
    const classification = this.classifyFailure(error, validationResult);

    logger.agent(this.name, null, `Classified failure for ${nodeId} as '${classification}' (Attempt: ${currentRetryCount + 1}/${this.maxRetries})`);

    // AUTH_EXPIRED cannot be auto-recovered without user reconnect -> ESCALATE immediately
    if (classification === FAILURE_TAXONOMY.AUTH_EXPIRED) {
      return {
        action: 'escalate',
        classification,
        reason: 'Integration credential expired or disconnected. Operator intervention required.',
        shouldHalt: true,
      };
    }

    // MISSING_FIELDS requires graph revision -> ESCALATE
    if (classification === FAILURE_TAXONOMY.MISSING_FIELDS) {
      return {
        action: 'escalate',
        classification,
        reason: `Node output validation failed: ${validationResult.reason}`,
        shouldHalt: true,
      };
    }

    // TRANSIENT or RATE_LIMIT -> retry with exponential backoff if within retry limit
    if (currentRetryCount < this.maxRetries) {
      const backoffMs = this.initialBackoffMs * Math.pow(2, currentRetryCount) + Math.round(Math.random() * 200);
      return {
        action: 'retry_with_backoff',
        classification,
        backoffMs,
        retryCount: currentRetryCount + 1,
        maxRetries: this.maxRetries,
        reason: `Retrying after ${backoffMs}ms backoff (${currentRetryCount + 1}/${this.maxRetries})`,
      };
    }

    // Max retries exceeded -> ESCALATE
    return {
      action: 'escalate',
      classification,
      reason: `Maximum retry attempts (${this.maxRetries}) exhausted for ${nodeId}. Escalating to operator.`,
      shouldHalt: true,
    };
  }
}

module.exports = new RecoveryAgent();
