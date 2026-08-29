const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const { enqueueExecution } = require('../queues/executionQueue');
const orchestrator = require('../agents/orchestrator');

const executionService = {
  triggerExecution: async (workflowId, userId, inputs = {}) => {
    const workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
    if (!workflow) {
      const error = new Error('Workflow not found');
      error.statusCode = 404;
      throw error;
    }

    if (workflow.nodes.length === 0) {
      const error = new Error('Cannot execute empty workflow. Please add at least one trigger or action node.');
      error.statusCode = 400;
      throw error;
    }

    // Create immutable snapshot of workflow at execution time
    const workflowSnapshot = {
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      triggerConfig: workflow.triggerConfig,
      nodes: workflow.nodes,
      edges: workflow.edges,
      tags: workflow.tags,
    };

    const execution = await Execution.create({
      workflowId: workflow._id,
      triggeredBy: userId,
      workflowSnapshot,
      status: 'PENDING',
      inputs,
      outputs: {},
      error: null,
      retryCount: 0,
      startTime: new Date(),
    });

    // Enqueue background processing
    await enqueueExecution(execution._id, userId);

    return execution;
  },

  listExecutions: async ({ userId, status, page = 1, limit = 20 }) => {
    const query = { triggeredBy: userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [executions, total] = await Promise.all([
      Execution.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Execution.countDocuments(query),
    ]);

    return {
      executions,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  },

  getExecutionById: async (id, userId) => {
    const execution = await Execution.findOne({ _id: id, triggeredBy: userId });
    if (!execution) {
      const error = new Error('Execution not found');
      error.statusCode = 404;
      throw error;
    }
    return execution;
  },

  getExecutionTimeline: async (id, userId) => {
    const execution = await Execution.findOne({ _id: id, triggeredBy: userId });
    if (!execution) {
      const error = new Error('Execution not found');
      error.statusCode = 404;
      throw error;
    }

    const logs = await ExecutionLog.find({ executionId: id }).sort({ timestamp: 1 });
    return {
      execution,
      logs,
      langGraphSubstrate: orchestrator.getLangGraphStatus(),
    };
  },

  pauseExecution: async (id, userId) => {
    const execution = await executionService.getExecutionById(id, userId);
    if (execution.status !== 'RUNNING') {
      throw new Error(`Cannot pause execution in status: ${execution.status}`);
    }

    orchestrator.pauseExecution(id);
    execution.status = 'PAUSED';
    await execution.save();
    return execution;
  },

  resumeExecution: async (id, userId) => {
    const execution = await executionService.getExecutionById(id, userId);
    if (execution.status !== 'PAUSED') {
      throw new Error(`Cannot resume execution in status: ${execution.status}`);
    }

    orchestrator.resumeExecution(id, userId);
    execution.status = 'RUNNING';
    await execution.save();
    return execution;
  },

  cancelExecution: async (id, userId) => {
    const execution = await executionService.getExecutionById(id, userId);
    if (execution.status === 'COMPLETED' || execution.status === 'FAILED' || execution.status === 'CANCELLED') {
      return execution;
    }

    orchestrator.cancelExecution(id);
    execution.status = 'CANCELLED';
    execution.endTime = new Date();
    await execution.save();
    return execution;
  },
};

module.exports = executionService;
