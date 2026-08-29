const embeddingService = require('./embeddingService');
const config = require('../config/env');
const logger = require('../utils/logger');

class QueryEmbeddingService {
  constructor() {
    this.dimension = config.EMBEDDING_DIMENSION || 768;
  }

  async generateQueryVector(queryText) {
    if (!queryText || typeof queryText !== 'string' || queryText.trim().length === 0) {
      const error = new Error('Query text cannot be empty');
      error.code = 'INVALID_REQUEST';
      error.statusCode = 400;
      throw error;
    }

    try {
      const vector = await embeddingService.generateEmbedding(queryText.trim());

      if (!vector || !Array.isArray(vector) || vector.length !== this.dimension) {
        const error = new Error(`Generated vector dimension mismatch. Expected ${this.dimension}, got ${vector?.length}`);
        error.code = 'QUERY_EMBEDDING_FAILURE';
        error.statusCode = 500;
        throw error;
      }

      return vector;
    } catch (err) {
      if (!err.code) err.code = 'QUERY_EMBEDDING_FAILURE';
      logger.error('Failed to generate query embedding:', err);
      throw err;
    }
  }
}

module.exports = new QueryEmbeddingService();
