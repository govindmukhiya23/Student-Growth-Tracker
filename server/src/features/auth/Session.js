'use strict';

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    ip: {
      type: String,
      default: '',
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index automatically removes expired sessions
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
