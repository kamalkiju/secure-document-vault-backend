/**
 * Security utilities: path traversal protection, safe filenames.
 * No trust in client-provided paths.
 */

const path = require('path');

/**
 * Resolve path and ensure it stays within baseDir. Prevents path traversal.
 * @param {string} baseDir - Absolute base directory
 * @param {string} relativePath - User-provided or derived path segment
 * @returns {string} Resolved absolute path inside baseDir, or null if invalid
 */
function resolveSafePath(baseDir, relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return null;
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.resolve(baseDir, normalized);
  const baseResolved = path.resolve(baseDir);
  if (!resolved.startsWith(baseResolved) || resolved === baseResolved) {
    return null;
  }
  return resolved;
}

/**
 * Sanitize filename: remove path segments and dangerous chars.
 * @param {string} name - Original filename
 * @returns {string} Safe basename
 */
function sanitizeFileName(name) {
  if (!name || typeof name !== 'string') return 'unnamed';
  const basename = path.basename(name);
  const safe = basename.replace(/[<>:"/\\|?*]/g, '_');
  return Array.from(safe).filter((c) => c.charCodeAt(0) >= 32).join('').slice(0, 255) || 'unnamed';
}

module.exports = { resolveSafePath, sanitizeFileName };
