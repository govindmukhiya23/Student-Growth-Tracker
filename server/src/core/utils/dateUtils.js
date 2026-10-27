'use strict';

const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns YYYY-MM-DD string for a given date in Asia/Kolkata
 */
function getKolkataDateString(date = new Date()) {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

/**
 * Returns difference in calendar days between two YYYY-MM-DD strings (date2 - date1)
 */
function getDaysDifference(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00Z');
  const d2 = new Date(dateStr2 + 'T00:00:00Z');
  const diffMs = d2.getTime() - d1.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Returns the Monday YYYY-MM-DD for the calendar week of dateStr
 */
function getWeekStartDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0 is Sun, 1 is Mon
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d.toISOString().split('T')[0];
}

module.exports = {
  TIMEZONE,
  getKolkataDateString,
  getDaysDifference,
  getWeekStartDate,
};
