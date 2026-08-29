const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');
const config = require('../config/env');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN || '7d' }
  );
};

const authService = {
  registerStudent: async ({ name, email, password, department }) => {
    const existing = await Profile.findByEmail(email);
    if (existing) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    // Role is strictly 'student' for all public registrations
    const user = await Profile.createStudent({ name, email, password, department });
    const token = generateToken(user.id, user.role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        created_at: user.created_at,
      },
    };
  },

  login: async ({ email, password }) => {
    const user = await Profile.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email address or password.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await Profile.comparePassword(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email address or password.');
      error.statusCode = 401;
      throw error;
    }

    await Profile.updateLastLogin(user.id);
    const token = generateToken(user.id, user.role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        last_login: new Date(),
        created_at: user.created_at,
      },
    };
  },

  getProfile: async (userId) => {
    const user = await Profile.findById(userId);
    if (!user) {
      const error = new Error('User profile not found.');
      error.statusCode = 404;
      throw error;
    }
    return user;
  },
};

module.exports = authService;
