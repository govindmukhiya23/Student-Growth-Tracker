const { z } = require('zod');

// ── Auth schemas ──────────────────────────────────────────────────────────────
// Used by both the React form validation and the Express validate middleware.
// Server adds extra DB/network checks on top (uniqueness, breached passwords, etc.)

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters')
    .regex(
      /^[A-Za-z\u00C0-\u024F\s.'\\-]+$/,
      'Name may only contain letters, spaces, dots, apostrophes or hyphens'
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .max(254, 'Email must be at most 254 characters'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[A-Za-z0-9_]+$/, 'Username may only contain letters, digits or underscores'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128, 'Password must be at most 128 characters'),
  college: z.string().trim().min(1, 'College is required'),
  course: z.string().trim().min(1, 'Course is required'),
  year: z.coerce
    .number()
    .int()
    .min(1, 'Year must be between 1 and 6')
    .max(6, 'Year must be between 1 and 6'),
});

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ── Post schemas ──────────────────────────────────────────────────────────────

const LINKEDIN_URL_PATTERN =
  /^https:\/\/(www\.)?linkedin\.com\/(posts\/[^/?#]+|feed\/update\/urn:li:[^/?#]+)/i;

const submitPostSchema = z.object({
  url: z
    .string()
    .trim()
    .url('Enter a valid URL')
    .max(2048, 'URL must be at most 2048 characters')
    .refine(u => u.startsWith('https://'), 'URL must use HTTPS')
    .refine(
      u => LINKEDIN_URL_PATTERN.test(u),
      'URL must be a LinkedIn post URL (linkedin.com/posts/… or linkedin.com/feed/update/…)'
    ),
});

// ── Admin review schemas ──────────────────────────────────────────────────────

const reviewPostSchema = z.object({
  action: z.enum(['verify', 'reject']),
  note: z.string().trim().max(500, 'Note must be at most 500 characters').optional(),
});

const updateUserStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended', 'active']),
  reason: z.string().trim().max(500).optional(),
});

// ── Pagination ────────────────────────────────────────────────────────────────

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  registerSchema,
  loginSchema,
  submitPostSchema,
  reviewPostSchema,
  updateUserStatusSchema,
  paginationSchema,
  LINKEDIN_URL_PATTERN,
};
