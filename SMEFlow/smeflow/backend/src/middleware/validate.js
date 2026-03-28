const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Reads the result of express-validator chains and short-circuits
 * the request with a 422 if any validation errors were found.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`);
    return next(new AppError(messages.join('. '), 422));
  }
  next();
};

module.exports = validate;
