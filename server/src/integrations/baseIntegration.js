class BaseIntegration {
  constructor(providerName) {
    if (this.constructor === BaseIntegration) {
      throw new Error('BaseIntegration is an abstract class and cannot be instantiated directly.');
    }
    this.providerName = providerName;
  }

  async execute(action, params = {}, credentials = {}) {
    throw new Error(`execute() not implemented for integration: ${this.providerName}`);
  }

  validateParams(action, params = {}) {
    return { valid: true };
  }

  getAuthUrl(state) {
    throw new Error(`getAuthUrl() not implemented for integration: ${this.providerName}`);
  }

  async handleCallback(code) {
    throw new Error(`handleCallback() not implemented for integration: ${this.providerName}`);
  }
}

module.exports = BaseIntegration;
