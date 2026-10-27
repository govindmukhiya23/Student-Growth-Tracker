'use strict';

/**
 * Central error handler — must be the last app.use() in app.js.
 *
 * Rules (SECURITY.md §7):
 * - Never send stack traces or internal details to the client.
 * - Translate known error types to appropriate status codes.
 * - Log full error internally for debugging.
 */

// Mongoose duplicate key error
function isMongoDuplicate(err) {
  return err.code === 11000;
}

// Mongoose validation error
function isMongoValidation(err) {
  return err.name === 'ValidationError';
}

// Zod validation error (from the validate middleware)
function isZodError(err) {
  return err.name === 'ZodError' || err.isZodError;
}

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  // Log the full error server-side (never expose to client)
  console.error(`[${req.method}] ${req.path}`, err.status || 500, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Zod validation errors → 400 with field-level messages
  if (isZodError(err)) {
    const fieldErrors = err.errors
      ? err.errors.map(e => ({ field: e.path.join('.'), code: e.code, message: e.message }))
      : [{ message: err.message }];
    return res.status(400).json({ message: 'Validation failed.', errors: fieldErrors });
  }

  // Mongoose duplicate key → 409
  if (isMongoDuplicate(err)) {
    return res.status(409).json({ message: 'A record with that value already exists.' });
  }

  // Mongoose validation → 400
  if (isMongoValidation(err)) {
    const fieldErrors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ message: 'Validation failed.', errors: fieldErrors });
  }

  // JWT errors → 401
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  // Explicit status set by route handlers
  const status = err.status || err.statusCode || 500;

  // Generic message for 5xx — never leak internals
  const message =
    status >= 500
      ? 'An unexpected error occurred. Please try again.'
      : err.message || 'Request failed.';

  res.status(status).json({ message });
};
