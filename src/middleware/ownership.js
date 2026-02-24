/**
 * Ownership validation: user must own the resource or have share access.
 * Use after auth. Expects resource id in req.params (documentId, folderId).
 */

const { getDb } = require('../db/connection');
const { error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

function requireDocumentOwnershipOrShare(req, res, next) {
  const documentId = req.params.documentId || req.params.id;
  const userId = req.user?.id;
  if (!documentId || !userId) {
    return errorResponse(res, 'Document ID and authentication required', 400);
  }

  const db = getDb();
  const doc = db.prepare(
    'SELECT owner_id FROM documents WHERE id = ?'
  ).get(documentId);

  if (!doc) {
    return errorResponse(res, 'Document not found', 404);
  }
  if (doc.owner_id === userId) {
    req.documentOwnerId = doc.owner_id;
    return next();
  }

  const share = db.prepare(
    'SELECT id FROM shares WHERE document_id = ? AND grantee_id = ? AND revoked_at IS NULL'
  ).get(documentId, userId);
  if (share) {
    req.documentOwnerId = doc.owner_id;
    return next();
  }

  logger.warn('Authorization failure: document access denied', {
    path: req.path,
    userId,
    documentId,
  });
  return errorResponse(res, 'Access denied to this document', 403);
}

function requireDocumentOwnership(req, res, next) {
  const documentId = req.params.documentId || req.params.id;
  const userId = req.user?.id;
  if (!documentId || !userId) {
    return errorResponse(res, 'Document ID and authentication required', 400);
  }

  const db = getDb();
  const doc = db.prepare(
    'SELECT owner_id FROM documents WHERE id = ?'
  ).get(documentId);

  if (!doc) {
    return errorResponse(res, 'Document not found', 404);
  }
  if (doc.owner_id !== userId) {
    logger.warn('Authorization failure: document owner required', {
      path: req.path,
      userId,
      documentId,
    });
    return errorResponse(res, 'Only the document owner can perform this action', 403);
  }
  req.documentOwnerId = doc.owner_id;
  next();
}

function requireFolderOwnership(req, res, next) {
  const folderId = req.params.folderId || req.params.id;
  const userId = req.user?.id;
  if (!folderId || !userId) {
    return errorResponse(res, 'Folder ID and authentication required', 400);
  }

  const db = getDb();
  const folder = db.prepare(
    'SELECT owner_id FROM folders WHERE id = ?'
  ).get(folderId);

  if (!folder) {
    return errorResponse(res, 'Folder not found', 404);
  }
  if (folder.owner_id !== userId) {
    logger.warn('Authorization failure: folder access denied', {
      path: req.path,
      userId,
      folderId,
    });
    return errorResponse(res, 'Access denied to this folder', 403);
  }
  req.folderOwnerId = folder.owner_id;
  next();
}

module.exports = {
  requireDocumentOwnershipOrShare,
  requireDocumentOwnership,
  requireFolderOwnership,
};
