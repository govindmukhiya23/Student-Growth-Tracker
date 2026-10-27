'use strict';

const PointsLedger = require('./PointsLedger');
const { getKolkataDateString, getWeekStartDate } = require('../../core/utils/dateUtils');
const events = require('../../core/events');

const POINTS_PER_VERIFIED_POST = 10;
const WEEKLY_BONUS_POINTS = 10;

/**
 * Awards points for a verified post, respecting the daily cap and weekly bonus.
 * Idempotent: repeats are caught by the unique index and ignored.
 */
async function awardPostPoints(post, studentId) {
  const publishDate = post.extractedData?.publishedAt || post.createdAt;
  const dateStr = getKolkataDateString(publishDate);
  const weekStart = getWeekStartDate(dateStr);

  // Daily Cap Check: has student already received points on this date?
  const existingDayAward = await PointsLedger.findOne({
    studentId,
    date: dateStr,
    type: 'post_verified',
  });

  if (existingDayAward) {
    // Daily cap reached: only 1 post per day scores points
    post.dailyCapApplied = true;
    await post.save();
    return { pointsAwarded: 0, reason: 'Daily cap reached for this date.' };
  }

  try {
    await PointsLedger.create({
      studentId,
      postId: post._id,
      type: 'post_verified',
      points: POINTS_PER_VERIFIED_POST,
      date: dateStr,
      weekStart,
      reason: `Verified post on ${dateStr}`,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Idempotent duplicate: already awarded
      return { pointsAwarded: 0, reason: 'Already awarded (idempotent).' };
    }
    throw err;
  }

  events.emit('points.awarded', {
    studentId,
    postId: post._id,
    points: POINTS_PER_VERIFIED_POST,
    date: dateStr,
  });

  // Weekly Bonus Check: did this student have verified post days on all 7 days of this week?
  const uniqueDaysThisWeek = await PointsLedger.distinct('date', {
    studentId,
    weekStart,
    type: 'post_verified',
  });

  if (uniqueDaysThisWeek.length >= 7) {
    // Check if bonus already given for this week
    const existingBonus = await PointsLedger.findOne({
      studentId,
      weekStart,
      type: 'weekly_bonus',
    });

    if (!existingBonus) {
      try {
        await PointsLedger.create({
          studentId,
          postId: post._id,
          type: 'weekly_bonus',
          points: WEEKLY_BONUS_POINTS,
          date: dateStr,
          weekStart,
          reason: `7-day weekly bonus for week of ${weekStart}`,
        });

        events.emit('points.weekly_bonus_awarded', {
          studentId,
          points: WEEKLY_BONUS_POINTS,
          weekStart,
        });
      } catch (_e) {
        // Idempotent duplicate handled
      }
    }
  }

  return { pointsAwarded: POINTS_PER_VERIFIED_POST, date: dateStr };
}

/**
 * Reverses points if a verified post is later rejected
 */
async function reversePostPoints(post, studentId) {
  const originalAward = await PointsLedger.findOne({
    postId: post._id,
    type: 'post_verified',
  });

  if (!originalAward) return { pointsReversed: 0 };

  const existingReversal = await PointsLedger.findOne({
    postId: post._id,
    type: 'post_reversal',
  });

  if (existingReversal) return { pointsReversed: 0 };

  try {
    await PointsLedger.create({
      studentId,
      postId: post._id,
      type: 'post_reversal',
      points: -originalAward.points,
      date: getKolkataDateString(),
      reason: `Points reversed for post ${post._id}`,
    });

    events.emit('points.reversed', {
      studentId,
      postId: post._id,
      points: -originalAward.points,
    });
  } catch (_e) {
    // Idempotent duplicate handled
  }

  return { pointsReversed: -originalAward.points };
}

/**
 * Calculates net points for a student
 */
async function getStudentPointsTotal(studentId) {
  const result = await PointsLedger.aggregate([
    { $match: { studentId } },
    { $group: { _id: null, total: { $sum: '$points' } } },
  ]);
  return result[0]?.total || 0;
}

module.exports = {
  awardPostPoints,
  reversePostPoints,
  getStudentPointsTotal,
};
