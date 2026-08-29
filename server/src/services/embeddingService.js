const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

class EmbeddingService {
  constructor() {
    this.provider = config.EMBEDDING_PROVIDER || 'google';
    this.model = config.EMBEDDING_MODEL || 'text-embedding-004';
    this.dimension = config.EMBEDDING_DIMENSION || 768;
  }

  async generateEmbedding(text) {
    const embeddings = await this.generateBatchEmbeddings([text]);
    return embeddings[0];
  }

  async generateBatchEmbeddings(texts) {
    if (!texts || texts.length === 0) return [];

    // 1. Google Gemini Embeddings
    if (this.provider === 'google' && config.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        const embeddingModel = genAI.getGenerativeModel({ model: this.model });

        const results = [];
        for (const text of texts) {
          const res = await embeddingModel.embedContent(text);
          const values = res.embedding?.values;
          if (values && values.length > 0) {
            results.push(this.formatVector(values));
          } else {
            throw new Error('Empty vector returned from Gemini API');
          }
        }
        return results;
      } catch (err) {
        logger.warn('Gemini embedding generation failed, falling back to deterministic vector generator:', { error: err.message });
      }
    }

    // 2. OpenRouter / OpenAI Embeddings
    if (this.provider === 'openai' && config.OPENROUTER_API_KEY) {
      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/embeddings',
          {
            model: this.model,
            input: texts,
          },
          {
            headers: {
              Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );

        if (response.data?.data) {
          return response.data.data.map((item) => this.formatVector(item.embedding));
        }
      } catch (err) {
        logger.warn('OpenRouter embedding generation failed, falling back to deterministic vector generator:', { error: err.message });
      }
    }

    // 3. Deterministic In-Memory Float Vector Generator (for local testing / zero-dependency)
    logger.info(`Generated ${texts.length} deterministic ${this.dimension}-dim vector embeddings (Zero-Dep mode)`);
    return texts.map((t) => this.generateDeterministicVector(t, this.dimension));
  }

  // Ensures vectors are normalized and exactly match EMBEDDING_DIMENSION
  formatVector(rawValues) {
    let values = rawValues;
    if (values.length !== this.dimension) {
      if (values.length > this.dimension) {
        values = values.slice(0, this.dimension);
      } else {
        while (values.length < this.dimension) values.push(0.0);
      }
    }

    // Normalize vector (unit length for cosine distance)
    const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0)) || 1.0;
    return values.map((v) => parseFloat((v / norm).toFixed(6)));
  }

  // Deterministic high-entropy pseudo-random unit vector based on SHA-256 seed
  generateDeterministicVector(text, dimension) {
    const hash = crypto.createHash('sha256').update(text).digest();
    const vector = new Array(dimension);

    for (let i = 0; i < dimension; i++) {
      const byte1 = hash[i % hash.length];
      const byte2 = hash[(i + 7) % hash.length];
      // Generate pseudo-float between -1.0 and 1.0
      vector[i] = ((byte1 ^ byte2) / 128.0) - 1.0;
    }

    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1.0;
    return vector.map((v) => parseFloat((v / norm).toFixed(6)));
  }
}

module.exports = new EmbeddingService();
