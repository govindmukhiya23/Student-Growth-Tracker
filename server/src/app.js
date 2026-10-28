'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./core/config/env');
const { noSqlSanitise } = require('./core/middleware/validate');
const requestLogger = require('./core/middleware/requestLogger');
const errorHandler = require('./core/middleware/errorHandler');
const features = require('./features/index');

const app = express();

// ── Trust proxy ───────────────────────────────────────────────────────────────
// Set to 1 for a single reverse-proxy (e.g. Render, Vercel, Cloudflare).
// SECURITY.md §5.3: correct trust proxy is required for rate limit IP detection.
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // tighten when inline styles are removed
        imgSrc: ["'self'", 'data:', 'https://media.licdn.com'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: 'same-origin' },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
// SECURITY.md §7: allow only the known frontend origin
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing + size limits ────────────────────────────────────────────────
// SECURITY.md §6: limit JSON body to 10 KB for most routes
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── NoSQL injection sanitiser ─────────────────────────────────────────────────
app.use(noSqlSanitise);

// ── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Mount features from registry ─────────────────────────────────────────────
// Each feature exports { mountPath, router, init? }
features.forEach(feature => {
  if (feature.router) {
    const path = `/api/v1${feature.mountPath || ''}`;
    app.use(path, feature.router);
  }
  if (typeof feature.init === 'function') {
    feature.init(app);
  }
});

// ── Root landing route ────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'Student Growth Tracker API',
    status: 'online',
    version: '1.0.0',
    health: '/api/v1/health',
    frontend: env.CLIENT_ORIGIN || 'https://student-growth-tracker.netlify.app',
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ── Central error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
