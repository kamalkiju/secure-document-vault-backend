/**
 * Folder controller: create, list, update, delete. Ownership enforced by middleware.
 */

const folderService = require('../services/folderService');
const auditService = require('../services/auditService');
const { success, error: errorResponse } = require('../utils/response');

async function create(req, res, next) {
  try {
    const { name, parentId } = req.body;
    const folder = folderService.create(req.user.id, name, parentId || null);
    auditService.log(req.user.id, 'folder_create', 'folder', folder.id, { name }, req.ip);
    return success(res, { folder }, 'Folder created', 201);
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const { limit, offset } = req.query;
    const folders = folderService.listByOwner(req.user.id, limit, offset);
    return success(res, { folders }, 'OK');
  } catch (e) {
    next(e);
  }
}

async function getById(req, res, next) {
  try {
    const folderId = req.params.folderId || req.params.id;
    const folder = folderService.getById(folderId);
    if (!folder) {
      return errorResponse(res, 'Folder not found', 404);
    }
    if (folder.owner_id !== req.user.id) {
      return errorResponse(res, 'Access denied', 403);
    }
    return success(res, { folder }, 'OK');
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const folderId = req.params.folderId || req.params.id;
    const { name } = req.body;
    const folder = folderService.update(folderId, req.user.id, name);
    if (!folder) {
      return errorResponse(res, 'Folder not found', 404);
    }
    auditService.log(req.user.id, 'folder_update', 'folder', folderId, { name }, req.ip);
    return success(res, { folder }, 'OK');
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const folderId = req.params.folderId || req.params.id;
    const deleted = folderService.remove(folderId, req.user.id);
    if (!deleted) {
      return errorResponse(res, 'Folder not found or access denied', 404);
    }
    auditService.log(req.user.id, 'folder_delete', 'folder', folderId, null, req.ip);
    return success(res, { deleted: true }, 'OK');
  } catch (e) {
    next(e);
  }
}

module.exports = { create, list, getById, update, remove };
