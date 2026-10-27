'use strict';

const mongoose = require('mongoose');
const env = require('./config/env');

let connected = false;

async function connectDB() {
  if (connected) return;
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: env.NODE_ENV === 'test' ? 1000 : 30000,
    });
    connected = true;
    console.info('✅  MongoDB connected');
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
}

async function disconnectDB() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}

module.exports = { connectDB, disconnectDB };
