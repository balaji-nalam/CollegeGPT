const logger = require('../utils/logger');
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error processing ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
  });

  // Mongoose / SQL duplicate key error
  if (err.code === 11000 || err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'A record with that unique identifier already exists.',
      },
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const messages = err.errors ? Object.values(err.errors).map((e) => e.message) : [err.message];
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: messages,
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid session token signature. Please authenticate again.',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Session token has expired. Please log in again.',
      },
    });
  }

  const statusCode = err.statusCode || err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR');

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred. Please try again.',
    },
    message: err.message || 'An unexpected error occurred.',
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
