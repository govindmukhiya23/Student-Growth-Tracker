'use strict';

/**
 * Sanitizes a cell to prevent CSV Formula Injection (SECURITY.md §176).
 * Any field starting with =, +, -, @, \t, or \r is prefixed with a single quote.
 */
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();

  // Neutralize formula injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape embedded quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Converts array of objects into CSV string
 */
function toCsv(headers, rows) {
  const headerLine = headers.map(h => sanitizeCsvCell(h.label)).join(',');
  const rowLines = rows.map(row =>
    headers.map(h => sanitizeCsvCell(row[h.key] ?? '')).join(',')
  );
  return [headerLine, ...rowLines].join('\r\n');
}

module.exports = {
  sanitizeCsvCell,
  toCsv,
};
