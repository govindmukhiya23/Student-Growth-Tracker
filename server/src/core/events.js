'use strict';

const { EventEmitter } = require('events');

/**
 * In-process event bus.
 *
 * Features communicate exclusively through this bus — they never import
 * each other's internals (enforced by ESLint boundary rules).
 *
 * Usage:
 *   // Emit (in a feature service):
 *   events.emit('post.verified', { postId, studentId, publishedAt });
 *
 *   // Listen (in another feature's index.js):
 *   events.on('post.verified', handler);
 *
 * Available events (grow as phases progress):
 *   user.registered   – { userId }
 *   user.approved     – { userId, adminId }
 *   user.rejected     – { userId, adminId, reason }
 *   user.suspended    – { userId, adminId }
 *   post.submitted    – { postId, studentId }
 *   post.verified     – { postId, studentId, publishedAt }
 *   post.rejected     – { postId, studentId }
 */
const events = new EventEmitter();

// Prevent silent swallowing of listener errors
events.on('error', err => {
  console.error('Event bus error:', err.message);
});

// Increase max listeners if needed (one per feature per event)
events.setMaxListeners(50);

module.exports = events;
