/**
 * Server entry: load config (validates env), init app, listen.
 * Port from config (process.env.PORT or default 5000).
 */

const config = require('./config');
const app = require('./app');
const logger = require('./utils/logger');

const PORT = config.port || 5000;
const server = app.listen(PORT, () => {
  logger.info('Server started', { port: PORT, env: config.env });
});

function shutdown() {
  server.close(() => {
    const { closeDb } = require('./db/connection');
    closeDb();
    logger.info('Server stopped');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = server;
