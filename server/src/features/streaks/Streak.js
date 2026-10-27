'use strict';

const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveDate: {
      type: String, // YYYY-MM-DD
      default: null,
    },
    streakDates: {
      type: [String],
      default: [],
    },
    exceptions: [
      {
        date: { type: String, required: true },
        grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reason: { type: String, default: '' },
        grantedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Streak = mongoose.model('Streak', streakSchema);

module.exports = Streak;
