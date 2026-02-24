/**
 * Folder CRUD. Parameterized queries. Ownership enforced at route level.
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/connection');

function create(ownerId, name, parentId = null) {
  const db = getDb();
  const id = uuidv4();
  const stmt = db.prepare(
    'INSERT INTO folders (id, name, parent_id, owner_id) VALUES (?, ?, ?, ?)'
  );
  stmt.run(id, name, parentId, ownerId);
  return getById(id);
}

function getById(folderId) {
  const db = getDb();
  return db.prepare(
    'SELECT id, name, parent_id, owner_id, created_at, updated_at FROM folders WHERE id = ?'
  ).get(folderId) || null;
}

function listByOwner(ownerId, limit = 50, offset = 0) {
  const db = getDb();
  return db.prepare(
    'SELECT id, name, parent_id, owner_id, created_at, updated_at FROM folders WHERE owner_id = ? ORDER BY name ASC LIMIT ? OFFSET ?'
  ).all(ownerId, limit, offset);
}

function update(folderId, ownerId, name) {
  const db = getDb();
  const stmt = db.prepare(
    'UPDATE folders SET name = ?, updated_at = datetime(\'now\') WHERE id = ? AND owner_id = ?'
  );
  stmt.run(name, folderId, ownerId);
  return getById(folderId);
}

function remove(folderId, ownerId) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM folders WHERE id = ? AND owner_id = ?');
  const result = stmt.run(folderId, ownerId);
  return result.changes > 0;
}

module.exports = { create, getById, listByOwner, update, remove };
