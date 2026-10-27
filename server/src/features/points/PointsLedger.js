'use strict';

const mongoose = require('mongoose');

const pointsLedgerSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['post_verified', 'weekly_bonus', 'post_reversal', 'admin_adjustment'],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD in Asia/Kolkata
      required: true,
      index: true,
    },
    weekStart: {
      type: String, // YYYY-MM-DD of Monday of this week
      default: null,
      index: true,
    },
    reason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Idempotency: The same post can never be awarded twice for the same ledger type
pointsLedgerSchema.index({ postId: 1, type: 1 }, { unique: true });
// Compound index for querying student score per calendar day
pointsLedgerSchema.index({ studentId: 1, date: 1 });

const PointsLedger = mongoose.model('PointsLedger', pointsLedgerSchema);

module.exports = PointsLedger;
