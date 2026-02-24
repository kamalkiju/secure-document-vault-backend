/**
 * Authentication: register, login, JWT. bcrypt ≥10 rounds. No plaintext passwords.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/connection');
const config = require('../config');
const auditService = require('./auditService');

function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, config.bcrypt.saltRounds);
}

function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

function register(email, plainPassword, role = 'member') {
  const db = getDb();
  const id = uuidv4();
  return hashPassword(plainPassword).then((passwordHash) => {
    const stmt = db.prepare(
      'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, email.toLowerCase().trim(), passwordHash, role);
    const user = db.prepare(
      'SELECT id, email, role, mfa_enabled, created_at FROM users WHERE id = ?'
    ).get(id);
    return { user, token: createToken(user) };
  });
}

// Valid bcrypt hash for constant-time comparison when user not found (prevents timing attacks).
const DUMMY_HASH = '$2b$10$KssILxWNR6k62B7yiX0GAe2Q7wwHlrzhF3LqtVvpyvHZf0MwvNfVu';

function login(email, plainPassword, ip = null) {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, email, password_hash, role, mfa_enabled FROM users WHERE email = ?'
  ).get(email.toLowerCase().trim());

  const hashToCompare = user ? user.password_hash : DUMMY_HASH;

  return comparePassword(plainPassword, hashToCompare).then((match) => {
    if (!user || !match) {
      return null;
    }
    auditService.log(user.id, 'login', 'user', user.id, null, ip);
    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      mfaEnabled: Boolean(user.mfa_enabled),
    };
    return { user: safeUser, token: createToken(safeUser) };
  });
}

function getById(userId) {
  const db = getDb();
  const row = db.prepare(
    'SELECT id, email, role, mfa_enabled, created_at FROM users WHERE id = ?'
  ).get(userId);
  return row || null;
}

module.exports = {
  hashPassword,
  comparePassword,
  createToken,
  register,
  login,
  getById,
};
