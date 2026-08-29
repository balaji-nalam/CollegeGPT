const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // PostgreSQL Database Connection
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'collegegpt_default_jwt_secret_2026_secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Embedding Configuration
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || 'google',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-004',
  EMBEDDING_DIMENSION: parseInt(process.env.EMBEDDING_DIMENSION || '768', 10),
  
  // Chunking Configuration (Architecture Approved Defaults: 700 chars / 100 overlap)
  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE || '700', 10),
  CHUNK_OVERLAP: parseInt(process.env.CHUNK_OVERLAP || '100', 10),
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),

  // RAG & Retrieval Configuration
  TOP_K: parseInt(process.env.TOP_K || '5', 10),
  SIMILARITY_THRESHOLD: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.15'),
  MAX_CONTEXT_CHARS: parseInt(process.env.MAX_CONTEXT_CHARS || '4000', 10),

  // LLM API Keys
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  
  // Admin Provisioning
  ADMIN_NAME: process.env.ADMIN_NAME || 'College Administrator',
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || 'admin@college.edu').toLowerCase(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'CollegeAdminSecure2026!',
  
  // Storage Provider
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads/documents'),
  
  // Supabase Storage Configuration (Production Document Storage)
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || 'collegegpt-documents',
};

module.exports = config;
