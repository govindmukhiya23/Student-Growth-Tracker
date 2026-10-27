'use strict';

const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const Redis = require('ioredis');
const env = require('./config/env');

// ── Redis client ──────────────────────────────────────────────────────────────

let redisClient;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      enableOfflineQueue: false,    // fail fast — don't queue commands when disconnected
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    redisClient.on('error', err => {
      // Log but don't crash — rate limiters fall back to memory
      console.error('Redis error (rate limiter will use memory fallback):', err.message);
    });
  }
  return redisClient;
}

// ── Factory ───────────────────────────────────────────────────────────────────
// Each call returns a { limiter, memoryFallback } pair.
// Features call this once at startup to get their specific limiters.
//
// For auth routes, failClose=true → use the memory fallback (stricter) when Redis is down.
// For other routes, failClose=false → pass through (fail open) when Redis is down.

function createLimiter({ keyPrefix, points, duration, blockDuration, failClose = false }) {
  const memoryFallback = new RateLimiterMemory({
    keyPrefix: `mem_${keyPrefix}`,
    // Stricter values for the memory fallback (fail-closed behaviour for auth)
    points: failClose ? Math.ceil(points / 2) : points,
    duration,
    blockDuration,
  });

  const limiter = new RateLimiterRedis({
    storeClient: getRedis(),
    keyPrefix,
    points,
    duration,
    blockDuration,
    insuranceLimiter: memoryFallback,
  });

  return { limiter, memoryFallback };
}

// ── IP normalisation helper ───────────────────────────────────────────────────
// For IPv6, key on the /64 prefix (SECURITY.md §5.3)
function normaliseIp(ip) {
  if (!ip) return 'unknown';
  // IPv6 with 4+ colon-separated groups → take the first 4 groups (/64)
  if (ip.includes(':') && !ip.startsWith('::ffff:')) {
    const groups = ip.split(':');
    if (groups.length >= 4) return groups.slice(0, 4).join(':');
  }
  // Strip IPv4-mapped IPv6 prefix
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

// ── Username normalisation helper ─────────────────────────────────────────────
// trim + lowercase + Unicode NFKC (SECURITY.md §5.1)
function normaliseUsername(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFKC');
}

// ── Express middleware factory ────────────────────────────────────────────────
// Wraps a rate limiter into a middleware.
// keyFn(req) → string (the rate limit key).

function rateLimitMiddleware(limiter, keyFn, { failClose = false } = {}) {
  return async (req, res, next) => {
    const key = keyFn(req);
    try {
      await limiter.consume(key);
      next();
    } catch (rl) {
      if (rl instanceof Error) {
        // Redis is down and failClose=false → pass through
        if (!failClose) return next();
        // failClose → treat as 429
        console.error('Rate limiter Redis error (fail-closed):', rl.message);
        return res.status(429).json({ message: 'Too many attempts. Try again later.' });
      }
      // rl is a RateLimiterRes object → limit exceeded
      const retrySecs = Math.ceil((rl.msBeforeNext || 60000) / 1000);
      res.set('Retry-After', String(retrySecs));
      // Never log the actual key value (may contain username); log a hash instead
      console.warn(`429 ${req.method} ${req.path} keyPrefix=${limiter._keyPrefix}`);
      res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }
  };
}

module.exports = { createLimiter, normaliseIp, normaliseUsername, rateLimitMiddleware, getRedis };
