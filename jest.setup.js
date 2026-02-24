/**
 * Jest setup: ensure test env vars and test DB exist before tests.
 */
require('dotenv').config();
process.env.DATABASE_PATH = process.env.DATABASE_PATH || './data/test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-min-32-characters';
process.env.ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

const path = require('path');
const fs = require('fs');
const dbDir = path.resolve(process.cwd(), path.dirname(process.env.DATABASE_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const Database = require('better-sqlite3');
const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH);
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
const schema = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  mfa_enabled INTEGER NOT NULL DEFAULT 0, mfa_secret_encrypted TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, parent_id TEXT, owner_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES folders(id), FOREIGN KEY (owner_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY, folder_id TEXT, owner_id TEXT NOT NULL, name TEXT NOT NULL, original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, storage_path TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (folder_id) REFERENCES folders(id), FOREIGN KEY (owner_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY, document_id TEXT NOT NULL, grantee_id TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'download')), granted_by TEXT NOT NULL,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')), revoked_at TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id), FOREIGN KEY (grantee_id) REFERENCES users(id), FOREIGN KEY (granted_by) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT NOT NULL, action TEXT NOT NULL,
  resource_type TEXT NOT NULL, resource_id TEXT, details TEXT, ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (actor_id) REFERENCES users(id)
);
`;
db.exec(schema);
db.close();
