'use strict';

const morgan = require('morgan');

// Custom token: request ID for log correlation
morgan.token('reqid', req => req.id || '-');

// SECURITY: never log Authorization header, Cookie header, or request/response bodies.
// morgan's combined format logs: method, url, status, response-time, referrer, user-agent.
// We omit the body entirely. For auth routes we log even less.

const REDACT_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/reset-password'];

function shouldRedact(req) {
  return REDACT_PATHS.some(p => req.path.includes(p));
}

// Format for normal routes
const normalFormat =
  ':method :url :status :res[content-length] - :response-time ms';

// Format for auth routes — omit URL details (might contain tokens in rare cases)
const authFormat = ':method [auth-route] :status - :response-time ms';

module.exports = function requestLogger(req, res, next) {
  const format = shouldRedact(req) ? authFormat : normalFormat;
  morgan(format, {
    stream: { write: msg => console.info(msg.trim()) },
    skip: () => process.env.NODE_ENV === 'test',
  })(req, res, next);
};
