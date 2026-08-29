const workflowService = require('../services/workflowService');

const workflowController = {
  getDashboardStats: async (req, res, next) => {
    try {
      const stats = await workflowService.getDashboardStats(req.user._id);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  listWorkflows: async (req, res, next) => {
    try {
      const { search, tag, status, page, limit } = req.query;
      const result = await workflowService.listWorkflows({
        owner: req.user._id,
        search,
        tag,
        status,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  createWorkflow: async (req, res, next) => {
    try {
      const { name, description, triggerConfig, nodes, edges, tags } = req.body;
      const workflow = await workflowService.createWorkflow({
        name,
        description,
        owner: req.user._id,
        triggerConfig,
        nodes,
        edges,
        tags,
      });
      res.status(201).json({
        success: true,
        message: 'Workflow created successfully',
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  },

  getWorkflowById: async (req, res, next) => {
    try {
      const workflow = await workflowService.getWorkflowById(req.params.id, req.user._id);
      res.status(200).json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  },

  updateWorkflow: async (req, res, next) => {
    try {
      const workflow = await workflowService.updateWorkflow(req.params.id, req.user._id, req.body);
      res.status(200).json({
        success: true,
        message: 'Workflow updated successfully',
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  },

  duplicateWorkflow: async (req, res, next) => {
    try {
      const workflow = await workflowService.duplicateWorkflow(req.params.id, req.user._id);
      res.status(201).json({
        success: true,
        message: 'Workflow duplicated successfully',
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteWorkflow: async (req, res, next) => {
    try {
      const result = await workflowService.deleteWorkflow(req.params.id, req.user._id);
      res.status(200).json({
        success: true,
        message: 'Workflow deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = workflowController;
