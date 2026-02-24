/**
 * Document CRUD and file storage paths. Parameterized queries.
 * Actual file I/O in upload middleware / controller (streaming).
 */

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { getDb } = require('../db/connection');
const config = require('../config');
const { sanitizeFileName } = require('../utils/security');

function create(ownerId, folderId, originalName, mimeType, sizeBytes, storagePath) {
  const db = getDb();
  const id = uuidv4();
  const name = sanitizeFileName(originalName) || 'document';
  const stmt = db.prepare(
    'INSERT INTO documents (id, folder_id, owner_id, name, original_name, mime_type, size_bytes, storage_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, folderId, ownerId, name, originalName, mimeType, sizeBytes, storagePath);
  return getById(id);
}

function getById(documentId) {
  const db = getDb();
  const row = db.prepare(
    'SELECT id, folder_id, owner_id, name, original_name, mime_type, size_bytes, storage_path, created_at, updated_at FROM documents WHERE id = ?'
  ).get(documentId);
  return row || null;
}

function listByOwner(ownerId, folderId = null, limit = 50, offset = 0) {
  const db = getDb();
  if (folderId) {
    return db.prepare(
      'SELECT id, folder_id, owner_id, name, original_name, mime_type, size_bytes, created_at FROM documents WHERE owner_id = ? AND folder_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(ownerId, folderId, limit, offset);
  }
  return db.prepare(
    'SELECT id, folder_id, owner_id, name, original_name, mime_type, size_bytes, created_at FROM documents WHERE owner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(ownerId, limit, offset);
}

function listSharedWithUser(userId, limit = 50, offset = 0) {
  const db = getDb();
  return db.prepare(
    `SELECT d.id, d.folder_id, d.owner_id, d.name, d.original_name, d.mime_type, d.size_bytes, d.created_at, s.permission
     FROM documents d
     INNER JOIN shares s ON s.document_id = d.id AND s.grantee_id = ? AND s.revoked_at IS NULL
     ORDER BY d.created_at DESC LIMIT ? OFFSET ?`
  ).all(userId, limit, offset);
}

function remove(documentId, ownerId) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM documents WHERE id = ? AND owner_id = ?');
  const result = stmt.run(documentId, ownerId);
  return result.changes > 0;
}

function getStorageAbsolutePath(relativePath) {
  return path.resolve(process.cwd(), config.upload.storagePath, relativePath);
}

function generateStorageRelativePath(documentId, originalName) {
  const ext = path.extname(sanitizeFileName(originalName)) || '';
  const safeName = `${documentId}${ext}`;
  return safeName;
}

module.exports = {
  create,
  getById,
  listByOwner,
  listSharedWithUser,
  remove,
  getStorageAbsolutePath,
  generateStorageRelativePath,
};
