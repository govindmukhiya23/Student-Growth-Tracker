'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');
const features = require('../../core/config/features');

const router = Router();

/**
 * GET /api/v1/health
 * Public — no auth required.
 * Returns the overall status of the server and its dependencies.
 */
router.get(['/', '/health'], async (_req, res) => {
  const mongoState = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const mongoOk = mongoState === 1;

  const status = mongoOk ? 'ok' : 'degraded';
  res.status(mongoOk ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      mongo: mongoOk ? 'connected' : 'disconnected',
    },
  });
});

/**
 * GET /api/v1/features
 * Returns the feature flags so the client can build its registry dynamically.
 */
router.get('/features', (_req, res) => {
  res.json({ features });
});

module.exports = {
  // Mount path — app.js reads this from the feature
  mountPath: '/',
  router,
};
