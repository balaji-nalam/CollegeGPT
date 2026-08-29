const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const config = require('../config/env');
const logger = require('../utils/logger');

let executionQueue = null;
let isRedisConnected = false;

// Initialize BullMQ Queue if Redis URL is configured & connectable
if (config.REDIS_URL) {
  try {
    const connection = new IORedis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      reconnectOnError: () => true,
    });

    connection.on('connect', () => {
      isRedisConnected = true;
      logger.info('Connected to Redis for BullMQ background queue');
    });

    connection.on('error', (err) => {
      logger.warn('Redis error, BullMQ falling back to in-memory asynchronous worker:', { error: err.message });
      isRedisConnected = false;
    });

    executionQueue = new Queue('workflow-executions', { connection });

    // BullMQ Worker
    const orchestrator = require('../agents/orchestrator');
    new Worker(
      'workflow-executions',
      async (job) => {
        logger.info(`BullMQ Worker picked up execution job #${job.data.executionId}`);
        await orchestrator.runWorkflow(job.data.executionId, job.data.userId);
      },
      { connection }
    );
  } catch (err) {
    logger.warn('BullMQ initialization skipped, using in-memory queue fallback:', { error: err.message });
  }
}

// Enqueue execution (BullMQ or in-memory asynchronous queue)
async function enqueueExecution(executionId, userId) {
  if (isRedisConnected && executionQueue) {
    try {
      await executionQueue.add('execute-workflow', { executionId, userId });
      logger.info(`Queued execution #${executionId} in BullMQ Redis`);
      return;
    } catch (e) {
      logger.warn('Failed to add job to BullMQ, falling back to asynchronous execution');
    }
  }

  // In-Memory Fallback Runner
  setImmediate(async () => {
    try {
      const orchestrator = require('../agents/orchestrator');
      await orchestrator.runWorkflow(executionId, userId);
    } catch (err) {
      logger.error(`In-Memory execution failed for #${executionId}`, err);
    }
  });
}

module.exports = {
  enqueueExecution,
  isRedisConnected: () => isRedisConnected,
};
