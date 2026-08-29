const aiService = require('../services/aiService');

const aiController = {
  generateWorkflow: async (req, res, next) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required for workflow generation',
        });
      }

      const generatedGraph = await aiService.generateWorkflowFromPrompt(prompt);
      res.status(200).json({
        success: true,
        message: `Workflow graph synthesized via ${generatedGraph.provider}`,
        data: generatedGraph,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = aiController;
