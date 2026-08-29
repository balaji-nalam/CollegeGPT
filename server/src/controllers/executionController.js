const executionService = require('../services/executionService');

const executionController = {
  triggerWorkflow: async (req, res, next) => {
    try {
      const execution = await executionService.triggerExecution(
        req.params.id,
        req.user._id,
        req.body.inputs || {}
      );
      res.status(201).json({
        success: true,
        message: 'Workflow execution dispatched',
        data: execution,
      });
    } catch (error) {
      next(error);
    }
  },

  listExecutions: async (req, res, next) => {
    try {
      const { status, page, limit } = req.query;
      const result = await executionService.listExecutions({
        userId: req.user._id,
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

  getExecutionById: async (req, res, next) => {
    try {
      const execution = await executionService.getExecutionById(req.params.id, req.user._id);
      res.status(200).json({
        success: true,
        data: execution,
      });
    } catch (error) {
      next(error);
    }
  },

  getExecutionTimeline: async (req, res, next) => {
    try {
      const timeline = await executionService.getExecutionTimeline(req.params.id, req.user._id);
      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  },

  pauseExecution: async (req, res, next) => {
    try {
      const execution = await executionService.pauseExecution(req.params.id, req.user._id);
      res.status(200).json({
        success: true,
        message: 'Execution paused',
        data: execution,
      });
    } catch (error) {
      next(error);
    }
  },

  resumeExecution: async (req, res, next) => {
    try {
      const execution = await executionService.resumeExecution(req.params.id, req.user._id);
      res.status(200).json({
        success: true,
        message: 'Execution resumed',
        data: execution,
      });
    } catch (error) {
      next(error);
    }
  },

  cancelExecution: async (req, res, next) => {
    try {
      const execution = await executionService.cancelExecution(req.params.id, req.user._id);
      res.status(200).json({
        success: true,
        message: 'Execution cancelled',
        data: execution,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = executionController;
