'use strict';



/**
 * validate(schema) — validates req.body (and optionally req.query / req.params)
 * against a Zod schema. Passes a ZodError to next() on failure so the central
 * error handler formats it as a 400 with field-level messages.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), controller);
 *
 *   // Validate query params too:
 *   router.get('/list', validate(z.object({ page: z.coerce.number() }), 'query'), controller);
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const err = result.error;
      err.isZodError = true; // flag for errorHandler
      err.status = 400;
      return next(err);
    }
    // Replace with the parsed (trimmed/coerced/defaulted) version
    req[source] = result.data;
    next();
  };
}

// ── Strip NoSQL injection operators ──────────────────────────────────────────
// Mongoose is typed so most injections fail naturally, but this provides
// defence-in-depth. Strip any key that starts with $ or contains a dot.
function stripOperators(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      obj[key] = stripOperators(obj[key]);
    }
  }
  return obj;
}

function noSqlSanitise(req, _res, next) {
  if (req.body) stripOperators(req.body);
  if (req.query) stripOperators(req.query);
  next();
}

module.exports = { validate, noSqlSanitise };
