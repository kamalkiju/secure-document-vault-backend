/**
 * Auth routes: register, login. Rate limit on login.
 */

const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createLoginLimiter } = require('../middleware/rateLimit');
const { auth: authSchemas } = require('../utils/validationSchemas');

const router = express.Router();

router.post(
  '/register',
  validate(authSchemas.register),
  authController.register
);

router.post(
  '/login',
  createLoginLimiter(),
  validate(authSchemas.login),
  authController.login
);

router.get('/me', auth, authController.me);

module.exports = router;
