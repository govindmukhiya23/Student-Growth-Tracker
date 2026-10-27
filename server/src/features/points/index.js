'use strict';

const pointsService = require('./pointsService');
const events = require('../../core/events');
const Post = require('../posts/Post');

function init() {
  events.on('post.verified', async payload => {
    try {
      const post = await Post.findById(payload.postId);
      if (post) {
        await pointsService.awardPostPoints(post, payload.studentId);
      }
    } catch (err) {
      console.error('Error awarding points on post.verified:', err.message);
    }
  });

  events.on('post.rejected', async payload => {
    try {
      if (payload.previousStatus === 'verified') {
        const post = await Post.findById(payload.postId);
        if (post) {
          await pointsService.reversePostPoints(post, payload.studentId);
        }
      }
    } catch (err) {
      console.error('Error reversing points on post.rejected:', err.message);
    }
  });
}

module.exports = {
  mountPath: '/points',
  init,
};
