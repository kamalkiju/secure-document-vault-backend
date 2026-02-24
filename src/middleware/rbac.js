/**
 * Role-Based Access Control. Requires auth middleware first.
 * Allowed roles per route. No privilege escalation.
 */

const { error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const ROLES = ['admin', 'member', 'viewer'];
const hierarchy = { admin: 3, member: 2, viewer: 1 };

function requireRoles(...allowedRoles) {
  const set = new Set(allowedRoles.filter((r) => ROLES.includes(r)));
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }
    if (!set.has(req.user.role)) {
      logger.warn('Authorization failure: role not allowed', {
        path: req.path,
        userId: req.user.id,
        role: req.user.role,
        allowed: [...set],
      });
      return errorResponse(res, 'Insufficient permissions', 403);
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  return requireRoles('admin')(req, res, next);
}

function requireMemberOrAbove(req, res, next) {
  return requireRoles('admin', 'member')(req, res, next);
}

module.exports = { requireRoles, requireAdmin, requireMemberOrAbove, ROLES, hierarchy };
