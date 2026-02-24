/**
 * Production logging with pino. Structured JSON. No sensitive data in logs.
 * LOG_LEVEL controls level (error, warn, info, debug).
 * Compatible API: logger.info(message, meta), logger.error(message, meta), etc.
 */

const pino = require('pino');

const level = process.env.LOG_LEVEL || 'info';

const pinoLogger = pino({
  level,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

function wrap(levelName) {
  return (msg, meta = {}) => {
    if (typeof msg === 'string') {
      pinoLogger[levelName](meta, msg);
    } else {
      pinoLogger[levelName](msg);
    }
  };
}

const logger = {
  error: wrap('error'),
  warn: wrap('warn'),
  info: wrap('info'),
  debug: wrap('debug'),
};

module.exports = logger;
