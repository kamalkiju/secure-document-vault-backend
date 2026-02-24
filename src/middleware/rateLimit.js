/**
 * Rate limiting for login and upload per PRD.
 * Uses express-rate-limit; config from env.
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

function createLoginLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.login.windowMs,
    max: config.rateLimit.login.max,
    message: { status: 'error', message: 'Too many login attempts', data: {} },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded: login', { ip: req.ip });
      return res.status(429).json({
        status: 'error',
        message: 'Too many login attempts. Try again later.',
        data: {},
      });
    },
  });
}

function createUploadLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.upload.windowMs,
    max: config.rateLimit.upload.max,
    message: { status: 'error', message: 'Too many uploads', data: {} },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded: upload', { ip: req.ip, userId: req.user?.id });
      return res.status(429).json({
        status: 'error',
        message: 'Too many uploads. Try again later.',
        data: {},
      });
    },
  });
}

module.exports = { createLoginLimiter, createUploadLimiter };
