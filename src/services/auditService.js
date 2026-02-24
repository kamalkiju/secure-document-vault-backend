/**
 * Immutable audit log. Append-only. Parameterized queries.
 */

const { getDb } = require('../db/connection');

function log(actorId, action, resourceType, resourceId = null, details = null, ip = null) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO audit_log (actor_id, action, resource_type, resource_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const detailsStr = details ? JSON.stringify(details) : null;
  stmt.run(actorId, action, resourceType, resourceId, detailsStr, ip);
}

function getByActor(actorId, limit = 100, offset = 0) {
  const db = getDb();
  const rows = db.prepare(
    'SELECT id, actor_id, action, resource_type, resource_id, details, ip, created_at FROM audit_log WHERE actor_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(actorId, limit, offset);
  return rows;
}

function getByResource(resourceType, resourceId, limit = 100, offset = 0) {
  const db = getDb();
  const rows = db.prepare(
    'SELECT id, actor_id, action, resource_type, resource_id, details, ip, created_at FROM audit_log WHERE resource_type = ? AND resource_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(resourceType, resourceId, limit, offset);
  return rows;
}

function getByDateRange(startDate, endDate, limit = 1000, offset = 0) {
  const db = getDb();
  const rows = db.prepare(
    'SELECT id, actor_id, action, resource_type, resource_id, details, ip, created_at FROM audit_log WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(startDate, endDate, limit, offset);
  return rows;
}

module.exports = { log, getByActor, getByResource, getByDateRange };
