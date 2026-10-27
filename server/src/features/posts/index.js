'use strict';

const { Router } = require('express');
const {
  submitPostSchema,
  reviewPostSchema,
  paginationSchema,
} = require('@growth-tracker/shared');
const { validate } = require('../../core/middleware/validate');
const {
  authenticate,
  loadUser,
  requireApproved,
  requireRole,
} = require('../../core/middleware/auth');
const Post = require('./Post');
const MetricSnapshot = require('./MetricSnapshot');
const postService = require('./postService');

const router = Router();

// ── Student Routes ────────────────────────────────────────────────────────────

/**
 * POST /api/v1/posts
 * Submit a LinkedIn post URL for verification
 */
router.post(
  '/posts',
  authenticate,
  loadUser,
  requireApproved,
  validate(submitPostSchema),
  async (req, res, next) => {
    try {
      const post = await postService.submitPost(req.user, req.body.url);
      res.status(201).json({
        message: 'Post submitted successfully and queued for review.',
        post,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/posts/mine
 * List the logged-in student's submitted posts
 */
router.get(
  '/posts/mine',
  authenticate,
  loadUser,
  requireApproved,
  validate(paginationSchema, 'query'),
  async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const query = { studentId: req.user._id };

      if (req.query.status) {
        query.status = req.query.status;
      }

      const [posts, total, pendingCount, verifiedCount, rejectedCount] = await Promise.all([
        Post.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Post.countDocuments(query),
        Post.countDocuments({ studentId: req.user._id, status: 'pending' }),
        Post.countDocuments({ studentId: req.user._id, status: 'verified' }),
        Post.countDocuments({ studentId: req.user._id, status: 'rejected' }),
      ]);

      res.json({
        posts,
        counts: {
          total,
          pending: pendingCount,
          verified: verifiedCount,
          rejected: rejectedCount,
        },
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/posts/:id
 * Retrieve a single post with metrics
 */
router.get(
  '/posts/:id',
  authenticate,
  loadUser,
  requireApproved,
  async (req, res, next) => {
    try {
      const post = await Post.findById(req.params.id).populate('studentId', 'name username college course year');
      if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
      }

      // SECURITY.md §100: Non-admin users cannot see posts from other students; return 404
      if (req.user.role !== 'admin' && post.studentId._id.toString() !== req.user._id.toString()) {
        return res.status(404).json({ message: 'Post not found.' });
      }

      res.json({ post });
    } catch (err) {
      next(err);
    }
  }
);

// ── Admin Routes ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/posts
 * Verification queue for admins
 */
router.get(
  '/admin/posts',
  authenticate,
  loadUser,
  requireRole('admin'),
  validate(paginationSchema, 'query'),
  async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const query = {};

      if (req.query.status) {
        query.status = req.query.status;
      }
      if (req.query.studentId) {
        query.studentId = req.query.studentId;
      }

      const [posts, total, pendingCount, needsReviewCount] = await Promise.all([
        Post.find(query)
          .populate('studentId', 'name username college course year email')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Post.countDocuments(query),
        Post.countDocuments({ status: 'pending' }),
        Post.countDocuments({ status: 'needs_review' }),
      ]);

      res.json({
        posts,
        queueCounts: {
          total,
          pending: pendingCount,
          needsReview: needsReviewCount,
        },
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/admin/posts/:id/review
 * Verify or reject a post
 */
router.patch(
  '/admin/posts/:id/review',
  authenticate,
  loadUser,
  requireRole('admin'),
  validate(reviewPostSchema),
  async (req, res, next) => {
    try {
      const post = await postService.reviewPost(req.user, req.params.id, req.body);
      res.json({
        message: `Post ${req.body.action === 'verify' ? 'verified' : 'rejected'} successfully.`,
        post,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/admin/posts/:id/metrics
 * Update likes, comments, and reposts
 */
router.patch(
  '/admin/posts/:id/metrics',
  authenticate,
  loadUser,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const post = await postService.updateMetrics(req.user, req.params.id, req.body);
      res.json({
        message: 'Metrics updated successfully.',
        post,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/posts/:id/metrics
 * View history snapshots of metrics
 */
router.get(
  '/admin/posts/:id/metrics',
  authenticate,
  loadUser,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const snapshots = await MetricSnapshot.find({ postId: req.params.id })
        .sort({ capturedAt: -1 })
        .limit(50);
      res.json({ snapshots });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = {
  mountPath: '',
  router,
};
