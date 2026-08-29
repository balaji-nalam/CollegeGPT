const { Server } = require('socket.io');
const config = require('./env');
const logger = require('../utils/logger');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.CLIENT_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);

    // Join room for specific execution run
    socket.on('join:execution', (executionId) => {
      if (executionId) {
        socket.join(`execution:${executionId}`);
        logger.info(`Socket ${socket.id} joined execution:${executionId}`);
      }
    });

    // Leave execution room
    socket.on('leave:execution', (executionId) => {
      if (executionId) {
        socket.leave(`execution:${executionId}`);
        logger.info(`Socket ${socket.id} left execution:${executionId}`);
      }
    });

    // Join user notification channel
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.info(`Socket ${socket.id} joined user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    logger.warn('Socket.IO not yet initialized when calling getIO()');
  }
  return io;
}

// Broadcast agent step event to execution subscribers
function emitExecutionEvent(executionId, event, data) {
  if (io && executionId) {
    io.to(`execution:${executionId}`).emit(event, data);
    // Also emit a general agent event
    io.to(`execution:${executionId}`).emit('agent:event', { event, data });
  }
}

// Broadcast notification to user
function emitUserNotification(userId, notification) {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit('notification:new', notification);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitExecutionEvent,
  emitUserNotification,
};
