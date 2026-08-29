const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('./env');
const logger = require('../utils/logger');

let pool = null;
let isPostgresConnected = false;
let isPgVectorAvailable = false;

// In-Memory Database Fallback Tables (for local zero-dependency development/eval)
const inMemoryStore = {
  profiles: new Map(),
  documents: new Map(),
  document_versions: new Map(),
  document_chunks: new Map(),
  conversations: new Map(),
  messages: new Map(),
  message_sources: new Map(),
  feedback: new Map(),
};

async function initPostgres() {
  if (!config.DATABASE_URL) {
    logger.warn('No DATABASE_URL configured. Initializing CollegeGPT In-Memory relational & vector store fallback...');
    return false;
  }

  try {
    pool = new Pool({
      connectionString: config.DATABASE_URL,
      connectionTimeoutMillis: 4000,
      idleTimeoutMillis: 30000,
    });

    const client = await pool.connect();
    logger.info('Connected to PostgreSQL successfully');
    isPostgresConnected = true;

    // Check pgvector extension
    try {
      const vecCheck = await client.query("SELECT * FROM pg_extension WHERE extname = 'vector'");
      if (vecCheck.rows.length > 0) {
        isPgVectorAvailable = true;
        logger.info('PostgreSQL pgvector extension is AVAILABLE and active');
      } else {
        logger.warn("pgvector extension not installed in connected PostgreSQL database. Run 'CREATE EXTENSION vector;'");
      }
    } catch (e) {
      logger.warn('Could not check pgvector extension', { error: e.message });
    }

    client.release();
    return true;
  } catch (err) {
    logger.warn('Failed to connect to PostgreSQL, falling back to in-memory store:', { error: err.message });
    isPostgresConnected = false;
    return false;
  }
}

async function runMigrations() {
  if (!isPostgresConnected || !pool) {
    logger.info('Using in-memory schema for CollegeGPT entities');
    return;
  }

  try {
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');
    
    // Replace dimension placeholder
    sql = sql.replace(/\{\{EMBEDDING_DIMENSION\}\}/g, String(config.EMBEDDING_DIMENSION || 768));

    await pool.query(sql);
    logger.info(`Executed PostgreSQL schema migrations with vector dimension ${config.EMBEDDING_DIMENSION}`);
  } catch (err) {
    logger.error('Error executing PostgreSQL schema migrations:', err);
  }
}

async function query(text, params) {
  if (isPostgresConnected && pool) {
    return pool.query(text, params);
  }

  // Handle fallback queries transparently
  return executeInMemoryQuery(text, params);
}

// In-Memory Query Emulator
function executeInMemoryQuery(text, params = []) {
  const sql = text.trim();
  const lower = sql.toLowerCase();

  // SELECT profiles by email
  if (lower.startsWith('select') && lower.includes('from profiles') && lower.includes('email =')) {
    const email = (params[0] || '').toLowerCase();
    const rows = Array.from(inMemoryStore.profiles.values()).filter((p) => p.email.toLowerCase() === email);
    return { rows, rowCount: rows.length };
  }

  // SELECT profiles by id
  if (lower.startsWith('select') && lower.includes('from profiles') && lower.includes('id =')) {
    const id = params[0];
    const profile = inMemoryStore.profiles.get(id);
    const rows = profile ? [profile] : [];
    return { rows, rowCount: rows.length };
  }

  // INSERT INTO profiles
  if (lower.startsWith('insert into profiles')) {
    const [name, email, password_hash, role, department] = params;
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    const profile = {
      id,
      name,
      email: email.toLowerCase(),
      password_hash,
      role: role || 'student',
      department: department || 'General',
      created_at: new Date(),
      updated_at: new Date(),
      last_login: new Date(),
    };
    inMemoryStore.profiles.set(id, profile);
    return { rows: [profile], rowCount: 1 };
  }

  // UPDATE profiles last_login
  if (lower.startsWith('update profiles') && lower.includes('last_login')) {
    const id = params[1] || params[0];
    const profile = inMemoryStore.profiles.get(id);
    if (profile) {
      profile.last_login = new Date();
    }
    return { rows: profile ? [profile] : [], rowCount: profile ? 1 : 0 };
  }

  // Generic fallback response
  return { rows: [], rowCount: 0 };
}

async function getHealthDiagnostics() {
  return {
    database: {
      type: isPostgresConnected ? 'PostgreSQL' : 'In-Memory (Local Fallback)',
      connected: true,
      pgvectorAvailable: isPostgresConnected ? isPgVectorAvailable : true, // Simulated true in local mode
      configuredVectorDimension: config.EMBEDDING_DIMENSION,
      configuredEmbeddingModel: config.EMBEDDING_MODEL,
      configuredEmbeddingProvider: config.EMBEDDING_PROVIDER,
    },
    storage: {
      provider: config.STORAGE_PROVIDER,
      supabaseConfigured: !!(config.SUPABASE_URL && config.SUPABASE_KEY),
    },
  };
}

module.exports = {
  initPostgres,
  runMigrations,
  query,
  getHealthDiagnostics,
  inMemoryStore,
  isPostgresConnected: () => isPostgresConnected,
  isPgVectorAvailable: () => isPgVectorAvailable,
};
