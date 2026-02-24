/**
 * Document routes: upload, list, get, download, delete, share.
 * Auth, ownership/share, rate limit on upload.
 */

const express = require('express');
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createUploadLimiter } = require('../middleware/rateLimit');
const {
  requireDocumentOwnershipOrShare,
  requireDocumentOwnership,
} = require('../middleware/ownership');
const { uploadSingle } = require('../middleware/upload');
const { document: documentSchemas } = require('../utils/validationSchemas');

const router = express.Router();

router.use(auth);

router.post(
  '/',
  createUploadLimiter(),
  uploadSingle('file'),
  documentController.upload
);

router.get(
  '/',
  validate(documentSchemas.list, 'query'),
  documentController.list
);

router.get('/shared', validate(documentSchemas.list, 'query'), documentController.listShared);

router.get(
  '/:documentId',
  requireDocumentOwnershipOrShare,
  documentController.getById
);

router.get(
  '/:documentId/download',
  requireDocumentOwnershipOrShare,
  documentController.download
);

router.delete(
  '/:documentId',
  requireDocumentOwnership,
  documentController.remove
);

router.post(
  '/:documentId/shares',
  requireDocumentOwnership,
  validate(documentSchemas.share),
  documentController.share
);

router.delete(
  '/:documentId/shares',
  requireDocumentOwnership,
  validate(documentSchemas.revokeShare),
  documentController.revokeShare
);

router.get(
  '/:documentId/shares',
  requireDocumentOwnership,
  documentController.listShares
);

module.exports = router;
