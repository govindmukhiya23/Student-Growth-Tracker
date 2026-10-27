'use strict';

const Streak = require('./Streak');
const { getKolkataDateString, getDaysDifference } = require('../../core/utils/dateUtils');
const events = require('../../core/events');

/**
 * Calculates current and longest streak from an array of active date strings (YYYY-MM-DD)
 * and exception dates.
 */
function calculateStreaks(dates, exceptions = []) {
  const exceptionDates = new Set(exceptions.map(e => e.date));
  const allDates = Array.from(new Set([...dates, ...exceptionDates])).sort();

  if (allDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
  }

  let longest = 0;
  let running = 0;
  let prevDate = null;

  for (const date of allDates) {
    if (!prevDate) {
      running = 1;
    } else {
      const diff = getDaysDifference(prevDate, date);
      if (diff === 1) {
        running += 1;
      } else if (diff === 0) {
        // same day, no change
      } else {
        // gap
        running = 1;
      }
    }
    if (running > longest) longest = running;
    prevDate = date;
  }

  // To check if current streak is currently active:
  // Today or Yesterday must be present in allDates
  const today = getKolkataDateString();
  const lastDate = allDates[allDates.length - 1];
  const daysSinceLast = getDaysDifference(lastDate, today);

  // If last post was today (diff 0) or yesterday (diff 1), the current streak is alive!
  // If > 1 day has passed without an exception, current streak is 0.
  const current = daysSinceLast <= 1 ? running : 0;

  return {
    currentStreak: current,
    longestStreak: Math.max(longest, current),
    lastActiveDate: lastDate,
  };
}

/**
 * Records a verified post date for a student and updates streak document
 */
async function recordVerifiedPostDate(studentId, dateStr) {
  let streak = await Streak.findOne({ studentId });
  if (!streak) {
    streak = new Streak({ studentId, streakDates: [] });
  }

  if (!streak.streakDates.includes(dateStr)) {
    streak.streakDates.push(dateStr);
  }

  const { currentStreak, longestStreak, lastActiveDate } = calculateStreaks(
    streak.streakDates,
    streak.exceptions
  );

  streak.currentStreak = currentStreak;
  streak.longestStreak = Math.max(streak.longestStreak || 0, longestStreak);
  streak.lastActiveDate = lastActiveDate;

  await streak.save();

  events.emit('streak.updated', {
    studentId,
    currentStreak,
    longestStreak: streak.longestStreak,
  });

  return streak;
}

/**
 * Removes a date (e.g. on post reversal) and recalculates
 */
async function removeVerifiedPostDate(studentId, dateStr) {
  const streak = await Streak.findOne({ studentId });
  if (!streak) return null;

  streak.streakDates = streak.streakDates.filter(d => d !== dateStr);

  const { currentStreak, longestStreak, lastActiveDate } = calculateStreaks(
    streak.streakDates,
    streak.exceptions
  );

  streak.currentStreak = currentStreak;
  streak.longestStreak = longestStreak;
  streak.lastActiveDate = lastActiveDate;

  await streak.save();

  events.emit('streak.updated', {
    studentId,
    currentStreak,
    longestStreak,
  });

  return streak;
}

/**
 * Admin grants a streak exception (audited)
 */
async function grantAdminException(studentId, dateStr, adminId, reason) {
  let streak = await Streak.findOne({ studentId });
  if (!streak) {
    streak = new Streak({ studentId, streakDates: [] });
  }

  streak.exceptions.push({
    date: dateStr,
    grantedBy: adminId,
    reason: reason ? reason.trim() : 'Admin exception',
    grantedAt: new Date(),
  });

  const { currentStreak, longestStreak, lastActiveDate } = calculateStreaks(
    streak.streakDates,
    streak.exceptions
  );

  streak.currentStreak = currentStreak;
  streak.longestStreak = Math.max(streak.longestStreak || 0, longestStreak);
  streak.lastActiveDate = lastActiveDate;

  await streak.save();

  events.emit('streak.exception_granted', {
    studentId,
    date: dateStr,
    adminId,
    reason,
  });

  return streak;
}

/**
 * Get student streak
 */
async function getStudentStreak(studentId) {
  let streak = await Streak.findOne({ studentId });
  if (!streak) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, streakDates: [] };
  }
  return streak;
}

module.exports = {
  calculateStreaks,
  recordVerifiedPostDate,
  removeVerifiedPostDate,
  grantAdminException,
  getStudentStreak,
};
