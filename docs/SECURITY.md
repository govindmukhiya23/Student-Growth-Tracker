# Student Growth Tracker — Security Document

**Version 1.0 · Status: Draft · Date: 27 October 2026**
**Applies to:** React client, Node.js/Express API, MongoDB, Redis, third-party services

---

## 1. Purpose and scope

This document defines the security requirements, controls and processes for Student Growth Tracker. It covers authentication, authorisation, rate limiting, input handling, data protection, LinkedIn integration, logging, infrastructure and incident response. It is a companion to the PRD and should be reviewed before every release.

---

## 2. Assets and threat model

### 2.1 What we protect

| Asset | Why it matters |
|---|---|
| Student accounts and credentials | Takeover exposes personal data and allows fake activity |
| Personal data (name, email, college, course) | Privacy and legal obligations |
| Admin accounts and APIs | Full control over approvals, scores and data |
| Posts, points ledger and leaderboard | Integrity of the competition |
| LinkedIn tokens (Phase 2) | Access to member data granted by students |
| Secrets and keys | Compromise exposes everything else |

### 2.2 Main threats

| Threat | Example | Primary controls |
|---|---|---|
| Credential stuffing and brute force | Bots trying leaked passwords on /auth/login | Rate limits by username and IP, hashing, monitoring, MFA for admins |
| Broken access control | Pending student calls an API directly | Server-side status and role checks on every request, ownership checks |
| Privilege escalation | Student registers as admin by sending role in the body | Role set only by the server; field allow-lists |
| Score manipulation | Replayed review request awards points twice | Unique indexes, server-side points, idempotent handlers, audit log |
| Injection | NoSQL operators in login body | Schema validation, operator stripping, typed queries |
| SSRF | Submitted URL makes the server fetch internal addresses | URL allow-list, DNS and IP checks, no redirects to private ranges |
| XSS and content injection | Post text rendered as HTML in admin panel | Output encoding, no raw HTML rendering, strict CSP |
| Token theft | XSS reads tokens from storage | httpOnly cookies for refresh tokens, short access tokens |
| Denial of service and abuse | Flood of submissions or exports | Layered rate limits, payload limits, queue concurrency caps |
| Insider misuse | Admin changes scores silently | Audit log, least privilege, review of audit logs |
| Supply chain | Malicious dependency update | Lockfiles, audits, pinned versions, minimal dependencies |

---

## 3. Authentication

### 3.1 Passwords

- Hash with **Argon2id** (preferred) or bcrypt cost 12+. Never store or log plain passwords.
- Minimum 10 characters, maximum 128. Check against common/breached passwords. No arbitrary composition rules.
- Use constant-time comparison and a dummy hash when the user does not exist (timing attack protection).
- Password reset tokens: random, single use, hashed in DB, expire in 30 minutes.
- Each password gets its own random salt (automatic with Argon2id).
- Optional server-side pepper (`PASSWORD_PEPPER`) in server `.env`.
- The `passwordHash` field is `select: false` and never returned in any API response, log or error message.
- On hash settings upgrade, re-hash at next successful login.

### 3.2 Sessions and tokens

| Item | Requirement |
|---|---|
| Access token | JWT, 15 minutes, signed with strong secret, contains user id and role only |
| Refresh token | Opaque random value, stored hashed server-side, 7 days, httpOnly + Secure + SameSite=Strict cookie |
| Rotation | Each refresh issues a new token; reuse of old one revokes the whole token family |
| Revocation | Logout, password change, suspension and admin action revoke sessions |
| Storage | Never in localStorage or URLs |
| Algorithm | Explicitly allow one algorithm; reject `none` and unexpected algorithms |

### 3.3 Admin accounts

- Never created by public registration.
- First admin created by seed script using environment secrets.
- Further admins created by an existing admin only.
- Multi-factor authentication (TOTP) required for admins before production launch.
- Admin sessions shorter (8 hours); admin login has stricter rate limits.

### 3.4 Account enumeration

- Login, registration and password reset return generic messages and similar timing for existing and non-existing accounts.
- Registration with an existing email shows a neutral message and sends the owner an email.

---

## 4. Authorisation

Every protected request passes through the same ordered middleware chain:

1. `authenticate` — verifies the access token.
2. `loadUser` — reads the user from the **database** (not from the token).
3. `requireApproved` — rejects pending, rejected and suspended users with 403.
4. `requireRole` — checks the role fits the route.
5. Ownership checks inside services.
6. `validate` — checks body, query and params against a schema.

**Rules:**
- Status is always read from the database, so suspension takes effect immediately.
- Admin routes live under `/api/v1/admin` and reject student accounts.
- Role, status, points, streaks and verification state can only be changed by server code. Request bodies are allow-listed.
- Use object identifiers scoped by owner in queries (e.g. find by id AND student) to prevent IDOR.
- Return 404 rather than 403 for other users' resources where existence should not be revealed.
- Frontend route guards are for UX only, never treated as security.

---

## 5. Rate limiting and abuse prevention

### 5.1 Principles

- Limits enforced on the server in Redis (shared store, works across instances). In-memory only as fallback.
- Three keys: IP address, username (from request body) and authenticated user id.
- Unauthenticated requests: limited by IP and, where username/email is present, by username too.
- Authenticated requests: limited primarily by user id, with a more generous IP limit as backstop.
- Usernames and emails normalised (trimmed, lowercased, Unicode-normalised) before use as keys.
- Login uses `username + IP` as the strict limit; a higher `username-only` limit adds delay/CAPTCHA instead of locking the account.
- Responses: HTTP 429 with `Retry-After` header and generic message. Never reveals whether username exists.
- Successful logins reset the `username + IP` counter, not the IP-wide counter.

### 5.2 Limit policy (starting values, tune with real traffic)

| Endpoint group | Key | Limit | Window | When exceeded |
|---|---|---|---|---|
| Login | username + IP | 5 failed attempts | 15 min | Block that pair for 15 min |
| Login | username only | 20 failed attempts | 1 hour | Delay + CAPTCHA; notify account owner |
| Login | IP only | 50 failed attempts | 15 min | Block IP for 30 min; raise alert |
| Admin login | username + IP | 3 failed attempts | 15 min | Block for 30 min; alert other admins |
| Registration | IP | 5 | 1 hour | 429 |
| Registration | email | 3 | 24 hours | 429 |
| Password reset / email verification | email | 3 | 1 hour | 429 (same response as success) |
| Password reset / email verification | IP | 10 | 1 hour | 429 |
| Token refresh | user id | 30 | 15 min | 429 and revoke session if abnormal |
| Post submission | user id | 10 | 1 hour | 429 |
| Post submission | user id | 20 | 24 hours | 429 |
| Post submission | IP | 100 | 1 hour | 429 (higher for shared college networks) |
| Student reads (dashboard, leaderboard, my posts) | user id | 60 | 1 min | 429 |
| General authenticated API | user id | 300 | 15 min | 429 |
| General authenticated API | IP | 2000 | 15 min | 429 |
| Admin API (reads and reviews) | admin user id | 600 | 15 min | 429 |
| CSV export | admin user id | 5 | 1 hour | 429 |
| Unauthenticated public endpoints | IP | 100 | 15 min | 429 |

Per-user overrides: an admin can temporarily raise/lower a specific user's limits; every override recorded in audit log.

### 5.3 Correct IP detection

- Configure `Express trust proxy` for the exact number of proxy hops.
- Never trust client-supplied IP headers directly.
- For IPv6, key limits on the `/64` network prefix.

### 5.4 Failure behaviour

- If rate limit store is unavailable, auth endpoints **fail closed** to in-memory limiter with stricter values.
- Other endpoints fail open; an alert is raised.
- All 429 events logged with key type, key hash and endpoint. Never log passwords or tokens.

### 5.5 Implementation reference

```js
const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const fallback = new RateLimiterMemory({ points: 3, duration: 900 });
const loginPair = new RateLimiterRedis({
  storeClient: redis, keyPrefix: 'login_pair',
  points: 5, duration: 15 * 60, blockDuration: 15 * 60,
  insuranceLimiter: fallback,
});
```

---

## 6. Input validation and request handling

- Validate every body, query and param with Zod. Reject unknown fields.
- Prevent NoSQL injection: only accept strings where strings are expected, strip keys beginning with `$` or containing `.`.
- Limit JSON body size (10 KB for most routes), set request timeouts, limit page size and sort fields.
- Escape/encode all user-generated text on output. Never use raw HTML injection for post text.
- Use allow-lists for filters and sort keys in admin lists and exports.
- CSV export must neutralise formula injection by prefixing cells starting with `=`, `+`, `-` or `@`.

### 6.1 Field validation rules

| Field | Client-side check | Server-side check |
|---|---|---|
| Name | Required, 2–60 chars, letters/spaces/dot/apostrophe/hyphen | Same after trim + Unicode normalise; reject control chars |
| Email | Required, valid format, ≤254 chars | Same; lowercase; uniqueness (generic response); optional domain allow-list |
| Username | 3–30 chars, letters/digits/underscore | Same; uniqueness; reserved words blocked |
| Password | 10–128 chars, strength hint | Same; common/breached check; never trimmed/logged/echoed |
| College, course, year | Chosen from fixed lists | Value must be in allow-list; year within range |
| LinkedIn post URL | Required, trimmed, https, linkedin.com host, post path pattern, ≤2048 chars | Same + normalisation, post ID parsing, SSRF protection, duplicate checks |
| Admin review note / rejection reason | ≤500 chars | ≤500 chars; encoded on output |
| Page, limit, sort | Controlled by UI | Page ≥1, limit ≤100, sort key from allow-list |

### 6.2 Duplicate post detection

**Checks, in order:**

1. **Same post:** Normalised URL or LinkedIn post ID matches an existing post from any student.
2. **Same publish date and time:** Extracted publish timestamp equals an earlier post by the same student, OR equals any earlier post with the same author or text fingerprint (hash of normalised text). Timestamp match alone across different students is NOT a duplicate.
3. **Late detection:** If publish time is only known after extraction, run the check again. A match marks the post as rejected duplicate and notifies the student.

**Error messages:**

| Case | HTTP | Message |
|---|---|---|
| Student already submitted this post | 409 | You already submitted this post on {date and time}. A post can only be submitted once. |
| Another student submitted this post | 409 | This post has already been submitted. Each post can only be used once. |
| Same publish date and time as student's earlier post | 409 | This post has the same publish date and time ({date and time}) as a post you already submitted. Please submit a different post. |

Dates and times use the platform timezone (e.g. 27 Oct 2026, 10:42 AM IST). Messages never reveal which other student submitted a post.

**Implementation:**
- Unique indexes on normalised URL and LinkedIn post ID.
- Catch MongoDB error 11000 and return the same 409.
- Client checks pasted URL against student's already-loaded posts (instant feedback).
- Duplicate attempts logged, count toward submission rate limit.
- 5+ duplicate attempts in 1 hour flags the student for admin review.

### 6.3 URL handling and SSRF protection

- Accept only `https` URLs on an allow-list of LinkedIn domains with expected post path patterns.
- Resolve DNS on the server; reject private, loopback, link-local and cloud metadata addresses:
  - `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` and IPv6 equivalents.
- Re-check after every redirect; limit redirects to a small number.
- Short timeouts, maximum response size, fixed user agent.
- Run extraction in a worker with limited network access and concurrency.

---

## 7. Web and API security controls

| Control | Requirement |
|---|---|
| HTTPS | HTTPS everywhere with HSTS; redirect HTTP |
| Security headers | helmet with strict CSP, X-Content-Type-Options, frame protections, referrer policy |
| CORS | Allow only known frontend origins, with credentials only where needed |
| CSRF | SameSite=Strict cookies, CSRF token or custom header on state-changing cookie routes |
| Errors | Generic messages to clients; stack traces only in server logs |
| API versioning | `/api/v1` prefix |
| Idempotency | Review and point-awarding handlers safe to repeat; unique indexes enforce this |

---

## 8. Data protection and privacy

- Collect only what is needed: name, email, college, course, year and LinkedIn post data.
- Encrypt in transit (TLS) and at rest (managed database encryption).
- Leaderboards and public views show only name, college, points and streak. Email, private notes and account status never exposed.
- Admin views logged.
- Do not log passwords, tokens, full request bodies or unnecessary personal data. Hash or truncate identifiers in rate limit logs.
- Backups encrypted, access-controlled and restore-tested.
- Consider India's DPDP Act 2023 obligations before launch.

---

## 9. LinkedIn integration security and compliance

- Use only official, approved LinkedIn access or data visible through permitted public previews.
- Do not use unofficial scraping, students' LinkedIn passwords or session cookies.
- Request minimum OAuth scopes. Store tokens encrypted. Delete when student disconnects.
- Treat all extracted content as untrusted: sanitise text, validate image URLs.
- A pasted URL is a claim, not proof. Author, date and existence confirmed by provider or admin.

---

## 10. Audit logging, monitoring and alerting

**Audit log (append-only):** Account approvals/rejections/suspensions; post verification/rejection; metric edits; points reversals; settings changes; admin creation; rate limit overrides; data exports; failed and successful admin logins.

Each entry records: actor, action, target, time, IP address, before/after summary. Cannot be edited or deleted through the application.

**Monitor and alert on:** Spikes in 401/403/429; repeated admin login failures; unusual export volume; points awarded outside the normal path; extraction errors; dependency vulnerabilities; rate limit store outages.

---

## 11. Infrastructure and secrets

- Secrets in hosting provider's secret manager or environment variables. Never in the repository.
- Rotate JWT secrets, DB credentials and email keys on schedule and after any suspected exposure.
- Separate dev/staging/production with different credentials and data.
- MongoDB Atlas: network access restricted to API hosts, least-privilege DB user, auth on, backups on.
- Redis: password required, private network access.
- Run server as non-root user; expose only required ports.
- CI: tests, linting, secret scanning and dependency audits on every PR.

### 11.1 Server-side .env file

- `.env` lives in the `server/` folder only. React client never reads it.
- `VITE_` prefixed variables are bundled into browser code — only public settings go there.
- `.env` in `.gitignore` from first commit. Only `.env.example` committed.
- Production: set variables in hosting provider. `dotenv` loads file only when `NODE_ENV !== 'production'`.
- Server checks every required variable with Zod at startup and refuses to start if one is missing.

**Required variables:**

| Variable | Purpose |
|---|---|
| `NODE_ENV`, `PORT` | Runtime mode and port |
| `MONGODB_URI` | Database connection string |
| `REDIS_URL` | Rate limiting and job queue store |
| `JWT_ACCESS_SECRET` | Signs access tokens |
| `JWT_REFRESH_SECRET` | Signs/hashes refresh tokens |
| `COOKIE_SECRET` | Signs cookies |
| `PASSWORD_PEPPER` | Optional pepper for password hashing |
| `TOKEN_ENCRYPTION_KEY` | Encrypts stored LinkedIn tokens (Phase 2) |
| `RESEND_API_KEY` | Transactional email |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth (Phase 2) |
| `TURNSTILE_SECRET_KEY` | CAPTCHA verification |
| `CLIENT_ORIGIN` | Allowed frontend origin for CORS |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | First admin (used once by seed script) |

---

## 12. Dependency and supply chain

- Commit lockfiles, pin versions, `npm ci` in CI.
- `npm audit` on every build.
- Remove unused dependencies.
- Enable automated dependency update PRs; wait for a stable period before adopting very new releases.

---

## 13. Incident response

| Step | Action |
|---|---|
| Detect | Alerts, user reports or audit log review |
| Contain | Revoke sessions, rotate secrets, block abusive IPs/accounts, disable feature via feature flag |
| Assess | Identify affected data and accounts from logs and audit trail |
| Notify | Inform affected users and institution; meet legal notification duties |
| Recover | Fix the cause, restore from backup if needed, verify fix |
| Review | Write post-incident report; update this document and tests |

---

## 14. Security testing

| Test | When |
|---|---|
| Unit tests for middleware chain (unauthenticated, pending, suspended, student on admin route) | Every build |
| Integration tests for duplicate posts, repeated review requests and points idempotency | Every build |
| Rate limit tests: login pair, username, IP, per-user submission, Retry-After header | Every build |
| NoSQL injection and mass-assignment tests on auth and profile routes | Before release |
| SSRF tests with private IPs, redirects and odd URL formats | Before release |
| Dependency and secret scanning | Every build |
| Manual review against OWASP Top 10 and API Security Top 10 | Before launch and after major changes |
| Penetration test or external review | Before public launch |

---

## 15. Pre-launch security checklist

- [ ] Passwords hashed with Argon2id or bcrypt cost 12+
- [ ] Access tokens short-lived; refresh tokens rotated, hashed and in httpOnly cookies
- [ ] Approval status and role verified from the database on every protected request
- [ ] Role, status and points cannot be set from request bodies
- [ ] Login, registration, reset, submission and admin limits active by username, user id and IP
- [ ] Trust proxy configured and verified with real forwarded headers
- [ ] SSRF protections tested for the LinkedIn preview fetcher
- [ ] Unique indexes on normalised URL, email, username and points ledger
- [ ] helmet, CSP, CORS allow-list and HTTPS with HSTS enabled
- [ ] Admin MFA enabled and seed admin credentials rotated
- [ ] Audit logging verified for every admin action
- [ ] Leaderboard confirmed free of email and private data
- [ ] Secrets stored outside the repository, with rotation process documented
- [ ] Backups encrypted and restore tested
- [ ] Retention and deletion policy approved
- [ ] Incident response owner assigned
- [ ] Client and server validation use the same shared schema, API tested with payloads that skip the client
- [ ] Duplicate URLs, and posts with same publish date and time, return 409 with correct message
- [ ] Unique indexes on normalised URL and post ID tested under concurrent requests
- [ ] `.env` is in `.gitignore`, only `.env.example` committed, secret scanner passes
- [ ] No secret appears in client code or client environment variables
- [ ] Production secrets set in hosting provider; server refuses to start with missing values

---

## 16. Document control

This document is owned by the engineering lead and reviewed before each release and after any security incident. Limit values in section 5 are starting points — adjust using real traffic data and abuse monitoring results.
