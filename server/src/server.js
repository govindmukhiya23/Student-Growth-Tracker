'use strict';

const app = require('./app');
const { connectDB } = require('./core/db');
const env = require('./core/config/env');

async function start() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.info(`🚀  Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  // Graceful shutdown
  function shutdown(signal) {
    console.info(`\n${signal} received — shutting down gracefully`);
    server.close(() => {
      console.info('HTTP server closed');
      process.exit(0);
    });
    // Force exit after 10 s if hanging connections
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
