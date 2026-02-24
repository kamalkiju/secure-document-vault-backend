/**
 * Audit routes: list own logs; admin can list by date range.
 */

const express = require('express');
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { audit: auditSchemas } = require('../utils/validationSchemas');

const router = express.Router();

router.use(auth);

router.get(
  '/me',
  validate(auditSchemas.list, 'query'),
  auditController.listMine
);

router.get(
  '/resource/:resourceType/:resourceId',
  validate(auditSchemas.list, 'query'),
  auditController.listByResource
);

router.get(
  '/export',
  requireAdmin,
  validate(auditSchemas.export, 'query'),
  auditController.listByDateRange
);

module.exports = router;
