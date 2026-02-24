/**
 * Server entry: load config (validates env), init app, listen.
 */

const config = require('./config');
const app = require('./app');
const logger = require('./utils/logger');

const server = app.listen(config.port, () => {
  logger.info('Server started', { port: config.port, env: config.env });
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
