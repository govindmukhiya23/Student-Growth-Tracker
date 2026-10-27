'use strict';

const mongoose = require('mongoose');

const metricSnapshotSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: {
      type: Number,
      default: 0,
      min: 0,
    },
    reposts: {
      type: Number,
      default: 0,
      min: 0,
    },
    source: {
      type: String,
      enum: ['manual', 'og', 'api'],
      default: 'manual',
    },
    capturedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for time-series metrics lookups per post
metricSnapshotSchema.index({ postId: 1, capturedAt: -1 });

const MetricSnapshot = mongoose.model('MetricSnapshot', metricSnapshotSchema);

module.exports = MetricSnapshot;
