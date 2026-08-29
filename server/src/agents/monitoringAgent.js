const ExecutionLog = require('../models/ExecutionLog');
const { emitExecutionEvent, emitUserNotification } = require('../config/socket');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

class MonitoringAgent {
  constructor() {
    this.name = 'monitoring';
  }

  async logEvent({ executionId, workflowId, nodeId, agent, level = 'info', message, metadata = {} }) {
    try {
      // 1. Persist granular log to MongoDB
      const logEntry = await ExecutionLog.create({
        executionId,
        workflowId,
        nodeId: nodeId || null,
        agent,
        level,
        message,
        metadata,
        timestamp: new Date(),
      });

      // 2. Broadcast live event to Socket.IO room `execution:<id>`
      emitExecutionEvent(executionId, `${agent}:step`, {
        id: logEntry._id,
        executionId,
        workflowId,
        nodeId,
        agent,
        level,
        message,
        metadata,
        timestamp: logEntry.timestamp,
      });

      logger.agent(agent, executionId, `[${level.toUpperCase()}] ${message}`);
      return logEntry;
    } catch (err) {
      logger.error(`MonitoringAgent failed to record event for execution ${executionId}`, err);
    }
  }

  async createAlertNotification({ ownerId, workflowId, executionId, type, title, message }) {
    try {
      const notif = await Notification.create({
        owner: ownerId,
        workflowId: workflowId || null,
        executionId: executionId || null,
        type: type || 'info',
        title,
        message,
        isRead: false,
      });

      emitUserNotification(ownerId, notif);
      return notif;
    } catch (err) {
      logger.error('MonitoringAgent failed to create notification', err);
    }
  }
}

module.exports = new MonitoringAgent();
