/**
 * Auth controller: register, login. No business logic in route handlers.
 */

const authService = require('../services/authService');
const { success, error: errorResponse } = require('../utils/response');
const { getDb } = require('../db/connection');

async function register(req, res, next) {
  try {
    const { email, password, role } = req.body;
    const existing = getDb().prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return errorResponse(res, 'Email already registered', 409);
    }
    const { user, token } = await authService.register(email, password, role);
    return success(res, { user, token }, 'Registered', 201);
  } catch (e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection?.remoteAddress;
    const result = await authService.login(email, password, ip);
    if (!result) {
      return errorResponse(res, 'Invalid credentials', 401);
    }
    return success(res, result, 'OK');
  } catch (e) {
    next(e);
  }
}

async function me(req, res, next) {
  try {
    const user = authService.getById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    return success(res, { user }, 'OK');
  } catch (e) {
    next(e);
  }
}

module.exports = { register, login, me };
