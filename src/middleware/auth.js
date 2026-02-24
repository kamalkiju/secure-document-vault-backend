/**
 * JWT authentication middleware. Tokens must include user id and expire.
 * Attaches req.user = { id, email, role }.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const { error: errorResponse } = require('../utils/response');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return errorResponse(res, 'Authentication required', 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (!decoded.userId || !decoded.role) {
      return errorResponse(res, 'Invalid token payload', 401);
    }
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    logger.warn('Invalid JWT', { path: req.path });
    return errorResponse(res, 'Invalid token', 401);
  }
}

module.exports = auth;
