/**
 * Secure file upload: streaming to disk, size/type limits, path traversal protection.
 * No hardcoded paths. Config from env.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { sanitizeFileName } = require('../utils/security');
const logger = require('../utils/logger');
const { error: errorResponse } = require('../utils/response');

const allowedMimes = new Set(config.upload.allowedMimes);
const maxFileSize = config.upload.maxFileSizeBytes;
const storagePath = path.resolve(process.cwd(), config.upload.storagePath);

function ensureUploadDir() {
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, storagePath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(sanitizeFileName(file.originalname)) || '';
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

function fileFilter(req, file, cb) {
  const mime = file.mimetype;
  if (!allowedMimes.has(mime)) {
    logger.warn('Upload rejected: invalid mime', { mime: file.mimetype });
    return cb(new Error('File type not allowed'), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter,
});

function uploadSingle(fieldName = 'file') {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return errorResponse(res, 'File too large', 413);
        }
        if (err.message === 'File type not allowed') {
          return errorResponse(res, err.message, 400);
        }
        logger.error('Upload error', { message: err.message });
        return errorResponse(res, 'Upload failed', 500);
      }
      next();
    });
  };
}

module.exports = { upload, uploadSingle, storagePath };
