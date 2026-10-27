'use strict';

const { Router } = require('express');
const { authenticate, loadUser, requireRole } = require('../../core/middleware/auth');
const Settings = require('./Settings');
const events = require('../../core/events');

const router = Router();

router.use(authenticate, loadUser, requireRole('admin'));

/**
 * GET /api/v1/admin/settings
 * Retrieve platform configuration
 */
router.get('/settings', async (_req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/admin/settings
 * Update platform configuration
 */
router.patch('/settings', async (req, res, next) => {
  try {
    const { pointsPerPost, weeklyBonusPoints, timezone, requireAdminApproval } = req.body;
    const settings = await Settings.getSingleton();

    if (pointsPerPost !== undefined) settings.pointsPerPost = Number(pointsPerPost);
    if (weeklyBonusPoints !== undefined) settings.weeklyBonusPoints = Number(weeklyBonusPoints);
    if (timezone !== undefined) settings.timezone = String(timezone).trim();
    if (requireAdminApproval !== undefined) settings.requireAdminApproval = Boolean(requireAdminApproval);

    await settings.save();

    events.emit('settings.updated', {
      adminId: req.user._id,
      settings: settings.toJSON(),
      ip: req.ip,
    });

    res.json({
      message: 'Platform settings updated successfully.',
      settings,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = {
  mountPath: '/admin',
  router,
};
