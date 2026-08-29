const http = require('http');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cors = require('cors');
const config = require('./config/env');
const { initPostgres, runMigrations } = require('./config/db');
const seedAdmin = require('./database/seedAdmin');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// CollegeGPT Routes
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

const app = express();
const server = http.createServer(app);

// Security & Utility Middleware
app.use(helmet());
app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(compression());
app.use(
  cors({
    origin: config.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check & Diagnostics
app.use('/api/health', healthRoutes);

// Core CollegeGPT API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Bootstrap CollegeGPT Server
async function start() {
  try {
    // 1. Initialize PostgreSQL & vector extension
    const connected = await initPostgres();
    if (connected) {
      await runMigrations();
    }

    // 2. Provision Initial Admin Account
    try {
      await seedAdmin();
    } catch (adminErr) {
      logger.warn('Admin provisioning deferred:', { error: adminErr.message });
    }

    // 3. Start HTTP Server
    const port = config.PORT;
    server.listen(port, () => {
      logger.info(`CollegeGPT Backend Server running on port ${port} in ${config.NODE_ENV} mode`);
      logger.info(`Vector Backend Model: ${config.EMBEDDING_MODEL} (${config.EMBEDDING_DIMENSION} dim) via ${config.EMBEDDING_PROVIDER}`);
      logger.info(`Client origin allowed: ${config.CLIENT_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, server };
