const authService = require('../services/authService');

const authController = {
  register: async (req, res, next) => {
    try {
      const { name, email, password, department } = req.body;
      const result = await authService.registerStudent({ name, email, password, department });
      res.status(201).json({
        success: true,
        message: 'Student account registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.status(200).json({
        success: true,
        message: 'Authenticated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = await authService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
