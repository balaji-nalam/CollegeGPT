const express = require('express');
const { getHealthDiagnostics } = require('../config/db');
const config = require('../config/env');

const router = express.Router();

router.get('/', async (req, res) => {
  const diagnostics = await getHealthDiagnostics();

  const isPostgres = diagnostics.database.type.toLowerCase().includes('postgresql');
  const databaseBackend = isPostgres ? 'postgresql' : 'memory';
  const vectorBackendStatus = isPostgres && diagnostics.database.pgvectorAvailable ? 'pgvector' : 'memory';

  res.status(200).json({
    status: 'healthy',
    system: 'CollegeGPT RAG Platform',
    timestamp: new Date().toISOString(),
    env: config.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    databaseBackend,
    vectorBackend: {
      provider: config.EMBEDDING_PROVIDER,
      model: config.EMBEDDING_MODEL,
      dimension: config.EMBEDDING_DIMENSION,
      pgvectorAvailable: diagnostics.database.pgvectorAvailable,
      databaseType: diagnostics.database.type,
      status: vectorBackendStatus,
    },
    storage: {
      provider: diagnostics.storage.provider,
      supabaseConnected: diagnostics.storage.supabaseConfigured,
      bucket: config.SUPABASE_BUCKET,
    },
    diagnostics: {
      database: {
        type: diagnostics.database.type,
        connected: diagnostics.database.connected,
        pgvectorAvailable: diagnostics.database.pgvectorAvailable,
      },
      embedding: {
        provider: config.EMBEDDING_PROVIDER,
        model: config.EMBEDDING_MODEL,
        dimension: config.EMBEDDING_DIMENSION,
      },
      retrieval: {
        topK: config.TOP_K || 5,
        similarityThreshold: config.SIMILARITY_THRESHOLD || 0.15,
        maxContextChars: config.MAX_CONTEXT_CHARS || 4000,
      },
    },
    aiProviders: {
      geminiConfigured: !!config.GEMINI_API_KEY,
      openRouterConfigured: !!config.OPENROUTER_API_KEY,
    },
  });
});

module.exports = router;
