'use strict';

const Post = require('./Post');
const MetricSnapshot = require('./MetricSnapshot');
const { normalizeLinkedInUrl, resolveShortUrl, validateDns, hashText } = require('./urlUtils');
const events = require('../../core/events');

function formatIstDate(date) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(new Date(date));
  } catch (_e) {
    return new Date(date).toISOString();
  }
}

/**
 * Submits and validates a LinkedIn post URL.
 */
async function submitPost(student, rawUrl) {
  const trimmed = (rawUrl || '').trim();
  let targetUrl = trimmed;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (_e) {
    const err = new Error('Invalid URL format.');
    err.status = 400;
    throw err;
  }

  if (parsed.hostname.toLowerCase() === 'lnkd.in') {
    targetUrl = await resolveShortUrl(trimmed);
  }

  const { normalizedUrl, linkedinPostId, originalUrl } = normalizeLinkedInUrl(targetUrl, trimmed);

  // SSRF DNS check
  const urlObj = new URL(normalizedUrl);
  await validateDns(urlObj.hostname);

  // Check 1: Duplicate by normalizedUrl or linkedinPostId
  const query = [{ normalizedUrl }];
  if (linkedinPostId) {
    query.push({ linkedinPostId });
  }

  const existing = await Post.findOne({ $or: query });
  if (existing) {
    const isSameStudent = existing.studentId.toString() === student._id.toString();
    const formattedDate = formatIstDate(existing.createdAt);

    const err = new Error(
      isSameStudent
        ? `You already submitted this post on ${formattedDate}. A post can only be submitted once.`
        : 'This post has already been submitted. Each post can only be used once.'
    );
    err.status = 409;
    throw err;
  }

  let post;
  try {
    post = await Post.create({
      studentId: student._id,
      originalUrl,
      normalizedUrl,
      linkedinPostId,
      status: 'verified',
      review: {
        reviewedAt: new Date(),
        action: 'verify',
        note: 'Auto-approved on submission',
      },
    });
  } catch (dbErr) {
    if (dbErr.code === 11000) {
      const err = new Error('This post has already been submitted. Each post can only be used once.');
      err.status = 409;
      throw err;
    }
    throw dbErr;
  }

  // Trigger background metadata extraction without blocking student response
  setImmediate(() => {
    extractPostMetadata(post._id).catch(err => {
      console.warn(`Extraction background error for post ${post._id}:`, err.message);
    });
  });

  events.emit('post.submitted', {
    postId: post._id,
    studentId: student._id,
    normalizedUrl,
  });

  events.emit('post.verified', {
    postId: post._id,
    studentId: student._id,
    adminId: null,
    publishedAt: post.createdAt,
    previousStatus: 'pending',
  });

  return post;
}

/**
 * Background worker to extract OpenGraph preview tags with SSRF & resource bounds
 */
async function extractPostMetadata(postId) {
  const post = await Post.findById(postId);
  if (!post || post.status === 'rejected') return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(post.normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      post.extractedData.extractionStatus = 'missing_fields';
      await post.save();
      return;
    }

    const html = await res.text();
    // Quick regex parsing for OpenGraph meta tags
    const getMeta = prop => {
      const match = html.match(new RegExp(`<meta\\s+property=["']${prop}["']\\s+content=["']([^"']*)["']`, 'i')) ||
                    html.match(new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+property=["']${prop}["']`, 'i'));
      return match ? match[1].replace(/&amp;/g, '&').trim() : null;
    };

    const title = getMeta('og:title') || '';
    const description = getMeta('og:description') || '';
    const image = getMeta('og:image') || '';

    // Extract author if title has format: "Author on LinkedIn: ..."
    let author = null;
    const authorMatch = title.match(/^(.+?)\s+on\s+LinkedIn:/i);
    if (authorMatch) {
      author = authorMatch[1].trim();
    }

    post.extractedData.authorName = author;
    post.extractedData.textSnippet = (description || title).slice(0, 1000);
    post.extractedData.textHash = hashText(description || title);
    post.extractedData.ogImage = image;

    // Check duplicate text fingerprint for the same student
    if (post.extractedData.textHash) {
      const duplicateFingerprint = await Post.findOne({
        _id: { $ne: post._id },
        studentId: post.studentId,
        'extractedData.textHash': post.extractedData.textHash,
      });

      if (duplicateFingerprint) {
        post.status = 'rejected';
        post.review = {
          reviewedAt: new Date(),
          action: 'reject',
          note: 'Duplicate text fingerprint matches an earlier submission.',
        };
        await post.save();
        events.emit('post.rejected', {
          postId: post._id,
          studentId: post.studentId,
          reason: 'Duplicate text fingerprint matches an earlier submission.',
          previousStatus: 'verified',
        });
        return;
      }
    }

    if (!author || (!description && !title)) {
      post.extractedData.extractionStatus = 'missing_fields';
    } else {
      post.extractedData.extractionStatus = 'success';
    }

    await post.save();
  } catch (_err) {
    post.extractedData.extractionStatus = 'failed';
    await post.save();
  }
}

/**
 * Admin review: verify or reject
 */
async function reviewPost(admin, postId, { action, note }) {
  const post = await Post.findById(postId);
  if (!post) {
    const err = new Error('Post not found.');
    err.status = 404;
    throw err;
  }

  const previousStatus = post.status;
  post.status = action === 'verify' ? 'verified' : 'rejected';
  post.review = {
    reviewedBy: admin._id,
    reviewedAt: new Date(),
    action,
    note: note ? note.trim() : null,
  };

  await post.save();

  if (action === 'verify') {
    events.emit('post.verified', {
      postId: post._id,
      studentId: post.studentId,
      adminId: admin._id,
      publishedAt: post.extractedData?.publishedAt || post.createdAt,
      previousStatus,
    });
  } else {
    events.emit('post.rejected', {
      postId: post._id,
      studentId: post.studentId,
      adminId: admin._id,
      reason: note || 'Post verification criteria not met.',
      previousStatus,
    });
  }

  return post;
}

/**
 * Admin updates metrics for a post
 */
async function updateMetrics(admin, postId, { likes, comments, reposts }) {
  const post = await Post.findById(postId);
  if (!post) {
    const err = new Error('Post not found.');
    err.status = 404;
    throw err;
  }

  post.metrics = {
    likes: Number(likes) || 0,
    comments: Number(comments) || 0,
    reposts: Number(reposts) || 0,
    capturedAt: new Date(),
  };

  await Promise.all([
    post.save(),
    MetricSnapshot.create({
      postId: post._id,
      likes: post.metrics.likes,
      comments: post.metrics.comments,
      reposts: post.metrics.reposts,
      source: 'manual',
    }),
  ]);

  events.emit('post.metrics_updated', {
    postId: post._id,
    adminId: admin._id,
    metrics: post.metrics,
  });

  return post;
}

module.exports = {
  submitPost,
  extractPostMetadata,
  reviewPost,
  updateMetrics,
};
