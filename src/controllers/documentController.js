/**
 * Document controller: upload, list, get, download, delete, share, revoke.
 * Secure streaming for download. Ownership/share enforced by middleware.
 */

const fs = require('fs');
const path = require('path');
const documentService = require('../services/documentService');
const shareService = require('../services/shareService');
const auditService = require('../services/auditService');
const config = require('../config');
const { success, error: errorResponse } = require('../utils/response');
const { resolveSafePath } = require('../utils/security');
const logger = require('../utils/logger');

async function upload(req, res, next) {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }
    const folderId = req.body.folderId || null;
    const originalName = req.file.originalname || 'document';
    const mimeType = req.file.mimetype;
    const sizeBytes = req.file.size;
    const storagePath = req.file.filename;

    const doc = documentService.create(
      req.user.id,
      folderId,
      originalName,
      mimeType,
      sizeBytes,
      storagePath
    );

    auditService.log(req.user.id, 'document_upload', 'document', doc.id, { name: doc.name }, req.ip);
    return success(res, { document: doc }, 'Document uploaded', 201);
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const { folderId, limit, offset } = req.query;
    const documents = documentService.listByOwner(req.user.id, folderId || null, limit, offset);
    return success(res, { documents }, 'OK');
  } catch (e) {
    next(e);
  }
}

async function listShared(req, res, next) {
  try {
    const { limit, offset } = req.query;
    const documents = documentService.listSharedWithUser(req.user.id, limit, offset);
    return success(res, { documents }, 'OK');
  } catch (e) {
    next(e);
  }
}

async function getById(req, res, next) {
  try {
    const documentId = req.params.documentId || req.params.id;
    const doc = documentService.getById(documentId);
    if (!doc) {
      return errorResponse(res, 'Document not found', 404);
    }
    const hasAccess = doc.owner_id === req.user.id || shareService.hasAccess(documentId, req.user.id, 'view');
    if (!hasAccess) {
      return errorResponse(res, 'Access denied', 403);
    }
    return success(res, { document: doc }, 'OK');
  } catch (e) {
    next(e);
  }
}

async function download(req, res, next) {
  try {
    const documentId = req.params.documentId || req.params.id;
    const doc = documentService.getById(documentId);
    if (!doc) {
      return errorResponse(res, 'Document not found', 404);
    }
    const hasAccess = shareService.hasAccess(documentId, req.user.id, 'download');
    if (!hasAccess) {
      return errorResponse(res, 'Access denied', 403);
    }

    const baseDir = path.resolve(process.cwd(), config.upload.storagePath);
    const safePath = resolveSafePath(baseDir, doc.storage_path);
    if (!safePath || !fs.existsSync(safePath)) {
      return errorResponse(res, 'File not found on disk', 404);
    }

    auditService.log(req.user.id, 'document_download', 'document', documentId, null, req.ip);

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_name)}"`);
    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const documentId = req.params.documentId || req.params.id;
    const doc = documentService.getById(documentId);
    if (!doc || doc.owner_id !== req.user.id) {
      return errorResponse(res, 'Document not found or access denied', 404);
    }
    const deleted = documentService.remove(documentId, req.user.id);
    if (!deleted) {
      return errorResponse(res, 'Document not found', 404);
    }
    const baseDir = path.resolve(process.cwd(), config.upload.storagePath);
    const safePath = resolveSafePath(baseDir, doc.storage_path);
    if (safePath && fs.existsSync(safePath)) {
      try {
        fs.unlinkSync(safePath);
      } catch (e) {
        logger.warn('Could not delete file from disk', { path: doc.storage_path });
      }
    }
    auditService.log(req.user.id, 'document_delete', 'document', documentId, null, req.ip);
    return success(res, { deleted: true }, 'OK');
  } catch (e) {
    next(e);
  }
}

async function share(req, res, next) {
  try {
    const documentId = req.params.documentId || req.params.id;
    const { granteeId, permission } = req.body;
    const doc = documentService.getById(documentId);
    if (!doc || doc.owner_id !== req.user.id) {
      return errorResponse(res, 'Document not found or access denied', 404);
    }
    const share = shareService.create(documentId, granteeId, permission, req.user.id);
    auditService.log(req.user.id, 'share_create', 'document', documentId, { granteeId, permission }, req.ip);
    return success(res, { share }, 'Share created', 201);
  } catch (e) {
    next(e);
  }
}

async function revokeShare(req, res, next) {
  try {
    const documentId = req.params.documentId || req.params.id;
    const { shareId } = req.body;
    const doc = documentService.getById(documentId);
    if (!doc || doc.owner_id !== req.user.id) {
      return errorResponse(res, 'Document not found or access denied', 404);
    }
    const share = shareService.getById(shareId);
    if (!share || share.document_id !== documentId) {
      return errorResponse(res, 'Share not found', 404);
    }
    shareService.revoke(shareId, req.user.id);
    auditService.log(req.user.id, 'share_revoke', 'document', documentId, { shareId }, req.ip);
    return success(res, { revoked: true }, 'OK');
  } catch (e) {
    next(e);
  }
}

async function listShares(req, res, next) {
  try {
    const documentId = req.params.documentId || req.params.id;
    const doc = documentService.getById(documentId);
    if (!doc || doc.owner_id !== req.user.id) {
      return errorResponse(res, 'Document not found or access denied', 404);
    }
    const shares = shareService.listByDocument(documentId);
    return success(res, { shares }, 'OK');
  } catch (e) {
    next(e);
  }
}

module.exports = {
  upload,
  list,
  listShared,
  getById,
  download,
  remove,
  share,
  revokeShare,
  listShares,
};
