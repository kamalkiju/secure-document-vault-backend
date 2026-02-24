/**
 * Application configuration. All values from environment.
 * No hardcoded secrets. Validate required vars at startup.
 */

require('dotenv').config();

const required = [
  'JWT_SECRET',
  'DATABASE_PATH',
  'ALLOWED_ORIGIN',
];

const optionalDefaults = {
  NODE_ENV: 'development',
  PORT: 5000,
  JWT_EXPIRES_IN: '7d',
  BCRYPT_SALT_ROUNDS: 12,
  RATE_LIMIT_LOGIN_MAX: 5,
  RATE_LIMIT_LOGIN_WINDOW_MS: 900000,
  RATE_LIMIT_UPLOAD_MAX: 20,
  RATE_LIMIT_UPLOAD_WINDOW_MS: 60000,
  UPLOAD_MAX_FILE_SIZE_MB: 100,
  UPLOAD_STORAGE_PATH: './data/uploads',
  LOG_LEVEL: 'info',
  UPLOAD_ALLOWED_MIMES: 'application/pdf,image/jpeg,image/png,image/gif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function loadConfig() {
  required.forEach((key) => {
    if (!process.env[key] || String(process.env[key]).trim() === '') {
      throw new Error(`Missing required env variable: ${key}`);
    }
  });

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || optionalDefaults.BCRYPT_SALT_ROUNDS, 10);
  if (isNaN(saltRounds) || saltRounds < 10) {
    throw new Error('BCRYPT_SALT_ROUNDS must be >= 10');
  }

  return {
    env: process.env.NODE_ENV || optionalDefaults.NODE_ENV,
    port: parseInt(process.env.PORT || optionalDefaults.PORT, 10),
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || optionalDefaults.JWT_EXPIRES_IN,
    },
    database: {
      path: process.env.DATABASE_PATH,
    },
    bcrypt: {
      saltRounds,
    },
    rateLimit: {
      login: {
        max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || optionalDefaults.RATE_LIMIT_LOGIN_MAX, 10),
        windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || optionalDefaults.RATE_LIMIT_LOGIN_WINDOW_MS, 10),
      },
      upload: {
        max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX || optionalDefaults.RATE_LIMIT_UPLOAD_MAX, 10),
        windowMs: parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS || optionalDefaults.RATE_LIMIT_UPLOAD_WINDOW_MS, 10),
      },
    },
    upload: {
      maxFileSizeBytes: (parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || optionalDefaults.UPLOAD_MAX_FILE_SIZE_MB, 10) || 100) * 1024 * 1024,
      storagePath: process.env.UPLOAD_STORAGE_PATH || optionalDefaults.UPLOAD_STORAGE_PATH,
      allowedMimes: (process.env.UPLOAD_ALLOWED_MIMES || optionalDefaults.UPLOAD_ALLOWED_MIMES).split(',').map((m) => m.trim()),
    },
    logLevel: process.env.LOG_LEVEL || optionalDefaults.LOG_LEVEL,
  };
}

const config = loadConfig();
module.exports = config;
