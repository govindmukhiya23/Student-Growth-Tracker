'use strict';

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    normalizedUrl: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    linkedinPostId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'needs_review', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    extractedData: {
      authorName: { type: String, default: null, trim: true },
      publishedAt: { type: Date, default: null, index: true },
      textSnippet: { type: String, default: null, trim: true, maxlength: 2000 },
      textHash: { type: String, default: null, index: true },
      ogImage: { type: String, default: null, trim: true },
      extractionStatus: {
        type: String,
        enum: ['pending', 'success', 'failed', 'missing_fields'],
        default: 'pending',
      },
    },
    metrics: {
      likes: { type: Number, default: 0, min: 0 },
      comments: { type: Number, default: 0, min: 0 },
      reposts: { type: Number, default: 0, min: 0 },
      capturedAt: { type: Date, default: null },
    },
    review: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      action: { type: String, enum: ['verify', 'reject'], default: null },
      note: { type: String, default: null, trim: true, maxlength: 500 },
    },
    dailyCapApplied: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying posts by student and publish date
postSchema.index({ studentId: 1, 'extractedData.publishedAt': 1 });
// Compound index for admin verification queue sorting
postSchema.index({ status: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
