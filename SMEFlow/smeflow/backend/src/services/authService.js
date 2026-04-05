const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const { isLocalDataMode } = require('../config/dataMode');
const localStore = require('../data/localStore');

/**
 * Generates a signed JWT token for the given user ID.
 */
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Registers a new user and returns a JWT.
 */
const signup = async ({ name, email, password }) => {
  const existingUser = isLocalDataMode()
    ? await localStore.findUserByEmail(email)
    : await User.findOne({ email });
  if (existingUser) {
    throw new AppError('A user with this email already exists.', 409);
  }

  const user = isLocalDataMode()
    ? await localStore.createUser({ name, email, password })
    : await User.create({ name, email, password });
  const token = signToken(user._id);

  logger.info(`New user registered: ${user.email} (${user._id})`);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

/**
 * Authenticates a user by email/password and returns a JWT.
 */
const login = async ({ email, password }) => {
  // Explicitly select password since it's excluded by default
  const user = isLocalDataMode()
    ? await localStore.findUserByEmail(email, { includePassword: true, activeOnly: true })
    : await User.findOne({ email, isActive: true }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = isLocalDataMode()
    ? await bcrypt.compare(password, user.password)
    : await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken(user._id);

  logger.info(`User logged in: ${user.email} (${user._id})`);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

/**
 * Verifies a JWT and returns the decoded payload.
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { signup, login, verifyToken };
