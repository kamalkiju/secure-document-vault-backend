/**
 * Centralized error handling. No stack traces in production.
 * Standard API response format. All errors logged.
 */

const logger = require('../utils/logger');
const { error: errorResponse } = require('../utils/response');
const config = require('../config');

const isProduction = config.env === 'production';

function errorHandler(err, req, res, _next) {
  if (process.env.NODE_ENV === 'production') {
    delete err.stack;
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  const meta = {
    path: req.path,
    method: req.method,
    statusCode,
  };
  if (!isProduction && err.stack) {
    meta.stack = err.stack;
  }
  logger.error(message, meta);

  const data = isProduction ? {} : (err.details || {});
  return errorResponse(res, message, statusCode, data);
}

function notFoundHandler(req, res, _next) {
  return errorResponse(res, 'Not found', 404);
}

module.exports = { errorHandler, notFoundHandler };
