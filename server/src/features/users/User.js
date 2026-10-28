'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // SECURITY.md §3.1: never returned by default in queries
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended', 'active'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    course: {
      type: String,
      trim: true,
      default: '',
    },
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: undefined,
      maxlength: 50,
      index: {
        unique: true,
        sparse: true,
      },
    },
    year: {
      type: Number,
      min: 1,
      max: 6,
      default: 1,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
