'use strict';

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    pointsPerPost: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },
    weeklyBonusPoints: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    requireAdminApproval: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure single document singleton
settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
