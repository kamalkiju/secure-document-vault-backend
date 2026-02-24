/**
 * Folder routes: CRUD. Auth + ownership enforced.
 */

const express = require('express');
const folderController = require('../controllers/folderController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { requireFolderOwnership } = require('../middleware/ownership');
const { folder: folderSchemas } = require('../utils/validationSchemas');

const router = express.Router();

router.use(auth);

router.post(
  '/',
  validate(folderSchemas.create),
  folderController.create
);

router.get(
  '/',
  validate(folderSchemas.list, 'query'),
  folderController.list
);

router.get(
  '/:folderId',
  requireFolderOwnership,
  folderController.getById
);

router.patch(
  '/:folderId',
  requireFolderOwnership,
  validate(folderSchemas.update),
  folderController.update
);

router.delete(
  '/:folderId',
  requireFolderOwnership,
  folderController.remove
);

module.exports = router;
