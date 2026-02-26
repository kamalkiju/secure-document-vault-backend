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

/**
* Create a new user account with the provided email and plain-text password, storing a hashed password and returning the created user record and an authentication token.
* @example
* register('user@example.com', 's3cr3t')
* { user: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'user@example.com', role: 'member', mfa_enabled: 0, created_at: '2024-01-01T00:00:00Z' }, token: 'eyJhbGciOi...' }
* @param {{string}} {{email}} - Email address for the new user.
* @param {{string}} {{plainPassword}} - Plain-text password which will be hashed before storage.
* @param {{string}} {{role}} - Role to assign to the user (optional, defaults to 'member').
* @returns {{Promise<Object>}} Return a Promise that resolves to an object containing the created user (id, email, role, mfa_enabled, created_at) and a JWT token.
**/
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

/**
* Authenticate a user by email and plaintext password and return a safe user object and token on success.
* @example
* login('user@example.com', 'password123')
* { user: { id: 1, email: 'user@example.com', role: 'user', mfaEnabled: false }, token: 'jwt.token.here' }
* @param {{string}} {{email}} - User email address (case-insensitive).
* @param {{string}} {{plainPassword}} - Plaintext password to verify against the stored hash.
* @param {{string|null}} {{ip}} - Optional IP address of the request for audit logging.
* @returns {{Promise<Object|null}} Resolves to an object containing the safe user and token when authentication succeeds, or null when it fails.
**/
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
