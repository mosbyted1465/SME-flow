const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Transforms Mongoose-specific errors into our AppError format.
 */
const handleMongooseError = (err) => {
  // Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return new AppError(`A record with this ${field} already exists.`, 409);
  }
  // Validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return new AppError(`Validation failed: ${messages.join('. ')}`, 422);
  }
  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return new AppError(`Invalid value for field: ${err.path}`, 400);
  }
  return err;
};

/**
 * Global error handling middleware.
 * Must be registered last (after all routes).
 */
const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  // Normalize mongoose errors
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000) {
    error = handleMongooseError(err);
  }

  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';
  const isOperational = error.isOperational || false;

  // Log unexpected errors with full stack
  if (!isOperational) {
    logger.error(`Unexpected error: ${err.message}`, { stack: err.stack, path: req.path });
  }

  // Development: expose stack trace
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status,
      message: error.message,
      stack: err.stack,
    });
  }

  // Production: hide internal details for unexpected errors
  if (!isOperational) {
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred. Please try again later.',
    });
  }

  return res.status(statusCode).json({
    status,
    message: error.message,
  });
};

module.exports = globalErrorHandler;
