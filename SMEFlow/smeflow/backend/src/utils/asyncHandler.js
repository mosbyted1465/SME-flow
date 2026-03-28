/**
 * Wraps async route handlers to eliminate repetitive try/catch blocks.
 * Forwards any thrown error to Express's next() error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
