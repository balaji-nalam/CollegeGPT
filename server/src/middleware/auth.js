const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Profile = require('../models/Profile');

const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid Bearer token.',
      });
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await Profile.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'The user account associated with this token no longer exists.',
        });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Session token has expired or is invalid. Please sign in again.',
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };
