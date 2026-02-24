/**
 * Document sharing: grant view/download, revoke. Parameterized queries.
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/connection');

function create(documentId, granteeId, permission, grantedBy) {
  const db = getDb();
  const id = uuidv4();
  const stmt = db.prepare(
    'INSERT INTO shares (id, document_id, grantee_id, permission, granted_by) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(id, documentId, granteeId, permission, grantedBy);
  return getById(id);
}

function getById(shareId) {
  const db = getDb();
  return db.prepare(
    'SELECT id, document_id, grantee_id, permission, granted_by, granted_at, revoked_at FROM shares WHERE id = ?'
  ).get(shareId) || null;
}

function listByDocument(documentId) {
  const db = getDb();
  return db.prepare(
    'SELECT id, document_id, grantee_id, permission, granted_by, granted_at, revoked_at FROM shares WHERE document_id = ? AND revoked_at IS NULL'
  ).all(documentId);
}

function revoke(shareId, documentOwnerId) {
  const db = getDb();
  const stmt = db.prepare(
    'UPDATE shares SET revoked_at = datetime(\'now\') WHERE id = ? AND document_id IN (SELECT id FROM documents WHERE owner_id = ?)'
  );
  stmt.run(shareId, documentOwnerId);
  const row = db.prepare('SELECT revoked_at FROM shares WHERE id = ?').get(shareId);
  return row && row.revoked_at != null;
}

function revokeByDocumentAndGrantee(documentId, granteeId, ownerId) {
  const db = getDb();
  const stmt = db.prepare(
    'UPDATE shares SET revoked_at = datetime(\'now\') WHERE document_id = ? AND grantee_id = ? AND document_id IN (SELECT id FROM documents WHERE owner_id = ?)'
  );
  const result = stmt.run(documentId, granteeId, ownerId);
  return result.changes > 0;
}

function hasAccess(documentId, userId, permission = 'download') {
  const db = getDb();
  const doc = db.prepare('SELECT owner_id FROM documents WHERE id = ?').get(documentId);
  if (!doc) return false;
  if (doc.owner_id === userId) return true;
  const share = db.prepare(
    'SELECT permission FROM shares WHERE document_id = ? AND grantee_id = ? AND revoked_at IS NULL'
  ).get(documentId, userId);
  if (!share) return false;
  if (permission === 'view') return true;
  return share.permission === 'download';
}

module.exports = {
  create,
  getById,
  listByDocument,
  revoke,
  revokeByDocumentAndGrantee,
  hasAccess,
};
