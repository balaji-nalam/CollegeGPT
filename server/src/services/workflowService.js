const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');

const workflowService = {
  createWorkflow: async ({ name, description, owner, triggerConfig, nodes, edges, tags }) => {
    const workflow = await Workflow.create({
      name: name || 'Untitled Automation',
      description: description || '',
      owner,
      triggerConfig: triggerConfig || { type: 'manual' },
      nodes: nodes || [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 250, y: 100 },
          data: { label: 'Manual Trigger', triggerType: 'manual', config: {} },
        },
      ],
      edges: edges || [],
      tags: tags || ['automation'],
      version: 1,
      status: 'draft',
    });
    return workflow;
  },

  listWorkflows: async ({ owner, search, tag, status, page = 1, limit = 20 }) => {
    const query = { owner };

    if (status) {
      query.status = status;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [workflows, total] = await Promise.all([
      Workflow.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Workflow.countDocuments(query),
    ]);

    return {
      workflows,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  },

  getWorkflowById: async (id, owner) => {
    const workflow = await Workflow.findOne({ _id: id, owner });
    if (!workflow) {
      const error = new Error('Workflow not found');
      error.statusCode = 404;
      throw error;
    }
    return workflow;
  },

  updateWorkflow: async (id, owner, updateData) => {
    const workflow = await Workflow.findOne({ _id: id, owner });
    if (!workflow) {
      const error = new Error('Workflow not found');
      error.statusCode = 404;
      throw error;
    }

    if (updateData.name !== undefined) workflow.name = updateData.name;
    if (updateData.description !== undefined) workflow.description = updateData.description;
    if (updateData.status !== undefined) workflow.status = updateData.status;
    if (updateData.triggerConfig !== undefined) workflow.triggerConfig = updateData.triggerConfig;
    if (updateData.nodes !== undefined) workflow.nodes = updateData.nodes;
    if (updateData.edges !== undefined) workflow.edges = updateData.edges;
    if (updateData.tags !== undefined) workflow.tags = updateData.tags;

    // Increment version upon structural edit
    if (updateData.nodes !== undefined || updateData.edges !== undefined) {
      workflow.version = (workflow.version || 1) + 1;
    }

    await workflow.save();
    return workflow;
  },

  duplicateWorkflow: async (id, owner) => {
    const original = await Workflow.findOne({ _id: id, owner });
    if (!original) {
      const error = new Error('Original workflow not found');
      error.statusCode = 404;
      throw error;
    }

    const cloned = await Workflow.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      owner,
      status: 'draft',
      triggerConfig: original.triggerConfig,
      nodes: original.nodes,
      edges: original.edges,
      version: 1,
      tags: original.tags,
    });

    return cloned;
  },

  deleteWorkflow: async (id, owner) => {
    const result = await Workflow.findOneAndDelete({ _id: id, owner });
    if (!result) {
      const error = new Error('Workflow not found');
      error.statusCode = 404;
      throw error;
    }
    return { id };
  },

  getDashboardStats: async (owner) => {
    const [totalWorkflows, activeWorkflows, totalExecutions, executions] = await Promise.all([
      Workflow.countDocuments({ owner }),
      Workflow.countDocuments({ owner, status: 'active' }),
      Execution.countDocuments({ triggeredBy: owner }),
      Execution.find({ triggeredBy: owner }).select('status duration').sort({ createdAt: -1 }).limit(100),
    ]);

    const runningExecutions = executions.filter((e) => e.status === 'RUNNING' || e.status === 'PENDING').length;
    const completedExecutions = executions.filter((e) => e.status === 'COMPLETED').length;
    const failedExecutions = executions.filter((e) => e.status === 'FAILED').length;

    const totalFinished = completedExecutions + failedExecutions;
    const successRate = totalFinished > 0 ? Math.round((completedExecutions / totalFinished) * 100) : 100;

    const durations = executions.filter((e) => e.duration > 0).map((e) => e.duration);
    const avgDurationMs = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 850;

    return {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      runningExecutions,
      completedExecutions,
      failedExecutions,
      successRate,
      avgDurationMs,
    };
  },
};

module.exports = workflowService;
