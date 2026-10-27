'use strict';

const dns = require('node:dns').promises;
const net = require('node:net');
const crypto = require('node:crypto');

const LINKEDIN_HOSTNAMES = new Set(['linkedin.com', 'www.linkedin.com']);

/**
 * Checks whether an IP address belongs to private/internal ranges (SSRF protection).
 */
function isPrivateIp(ip) {
  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (link-local / cloud metadata e.g. AWS 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    return false;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fe80:')) return true; // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    return false;
  }

  return true; // Unknown IP format -> fail closed
}

/**
 * Normalizes a LinkedIn post URL and extracts the canonical post ID.
 * Returns { normalizedUrl, linkedinPostId, originalUrl }
 */
function normalizeLinkedInUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (_e) {
    throw new Error('Invalid URL format.');
  }

  // Must be HTTPS
  if (parsed.protocol !== 'https:') {
    throw new Error('URL must use https protocol.');
  }

  // Host must be linkedin.com
  const hostname = parsed.hostname.toLowerCase();
  if (!LINKEDIN_HOSTNAMES.has(hostname)) {
    throw new Error('URL hostname must be linkedin.com or www.linkedin.com.');
  }

  const pathname = parsed.pathname.replace(/\/+$/, ''); // strip trailing slashes

  // Pattern A: /posts/<slug>-activity-<activityId>-<hash>
  // Pattern B: /feed/update/urn:li:activity:<activityId>
  // Pattern C: /feed/update/urn:li:share:<shareId>
  let linkedinPostId = null;

  const activityMatch = pathname.match(/activity-([0-9]{15,25})/i);
  if (activityMatch) {
    linkedinPostId = `urn:li:activity:${activityMatch[1]}`;
  } else {
    const urnMatch = pathname.match(/urn:li:(activity|share):([0-9]{15,25})/i);
    if (urnMatch) {
      linkedinPostId = `urn:li:${urnMatch[1].toLowerCase()}:${urnMatch[2]}`;
    }
  }

  // Build canonical normalized URL
  // If we have a canonical urn, canonicalize to www.linkedin.com/feed/update/{urn}
  // Otherwise clean query params and fragments from path
  let normalizedUrl;
  if (linkedinPostId) {
    normalizedUrl = `https://www.linkedin.com/feed/update/${linkedinPostId}`;
  } else {
    normalizedUrl = `https://www.linkedin.com${pathname}`;
  }

  return {
    normalizedUrl,
    linkedinPostId,
    originalUrl: rawUrl.trim(),
  };
}

/**
 * Validates destination hostname via DNS to guarantee no SSRF to private/internal IPs
 */
async function validateDns(hostname) {
  try {
    const addresses = await dns.resolve4(hostname);
    for (const ip of addresses) {
      if (isPrivateIp(ip)) {
        throw new Error(`DNS resolved to private IP: ${ip}`);
      }
    }
  } catch (err) {
    if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
      throw new Error('LinkedIn host could not be resolved.');
    }
    throw err;
  }
}

/**
 * Creates SHA-256 fingerprint for post text snippet (for deduplication check)
 */
function hashText(text) {
  if (!text) return null;
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

module.exports = {
  isPrivateIp,
  normalizeLinkedInUrl,
  validateDns,
  hashText,
};
