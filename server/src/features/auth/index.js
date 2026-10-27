'use strict';

const { Router } = require('express');
const { registerSchema, loginSchema } = require('@growth-tracker/shared');
const { validate } = require('../../core/middleware/validate');
const { authenticate, loadUser } = require('../../core/middleware/auth');
const authService = require('./authService');
const env = require('../../core/config/env');

const router = Router();

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth',
};

/**
 * POST /api/v1/auth/register
 */
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body, req);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/login
 */
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password, req);

    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_OPTIONS,
      expires: result.refreshExpiresAt,
    });

    res.json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const token = getCookie(req, 'refreshToken');
    const result = await authService.refresh(token, req);

    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_OPTIONS,
      expires: result.refreshExpiresAt,
    });

    res.json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', async (req, res, next) => {
  try {
    const token = getCookie(req, 'refreshToken');
    await authService.logout(token);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/me
 */
router.get('/me', authenticate, loadUser, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = {
  mountPath: '/auth',
  router,
};
