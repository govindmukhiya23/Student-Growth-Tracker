# Student Growth Tracker — Product Requirements Document (PRD)

**Version 1.0 · Status: Draft · Date: 27 October 2026**

---

## 1. Purpose

Student Growth Tracker is a web application for a college that lets students build a habit of posting on LinkedIn. Students register, wait for admin approval, then paste LinkedIn post URLs. Admins verify posts, award points and track streaks. A leaderboard ranks students to encourage healthy competition.

## 2. Users and roles

| Role | How created | What they can do |
|---|---|---|
| Student | Public registration + admin approval | Submit posts, view own dashboard, see leaderboard |
| Admin | Seed script or existing admin | Approve/reject/suspend accounts, verify posts, enter metrics, manage settings, view audit log |

## 3. Student lifecycle

1. Student fills in the registration form (name, email, username, password, college, course, year).
2. Account is created with status **pending**.
3. Admin reviews and either **approves** (student can log in fully) or **rejects** (student sees reason).
4. Admin can later **suspend** a student (immediate effect, even with a valid token) or **reactivate**.

## 4. Post lifecycle

1. Approved student pastes a LinkedIn post URL.
2. Server validates, normalises and checks for duplicates immediately.
3. Post is saved as **pending** and extraction runs in the background (student never waits).
4. If extraction finds missing fields, post becomes **needs_review**.
5. Admin verifies or rejects. On verification, points and streak are updated via events.
6. A verified post that is later rejected triggers a points reversal.

## 5. Scoring

- **Points per verified post:** 10 (configurable in settings).
- **Weekly bonus:** 10 extra points for 7 verified posts in a calendar week (configurable).
- **Daily cap:** Only one post per day counts toward points and streak (publish date in configured timezone, default `Asia/Kolkata`).
- **Engagement counts** (likes, comments, reposts) are shown but never scored.
- The same post can never be rewarded twice; a duplicate key error is caught and treated as idempotent.
- If a verified post is later rejected, a reversal entry is added to the ledger (net points go to zero for that post).

## 6. Streaks

- A streak day = the publish date of a verified post in the configured timezone.
- A missed day resets the current streak to 0 (unless an admin grants an exception, which is audited).
- Admin exception is stored on the streak document and shown in the audit log.

## 7. LinkedIn data strategy

| Tier | Source | Reliability |
|---|---|---|
| 1 (MVP) | URL validation, public Open Graph preview, admin verification, manual metrics | Medium |
| 2 | Student authorises LinkedIn connection | High for author |
| 3 | Official analytics API (if approved) | High |

Rules:
- No unofficial scraping as a primary source.
- Fields that cannot be retrieved are marked unavailable and routed to admin review.
- Apply for official API access in week 1.

## 8. Data model (summary)

| Collection | Purpose | Key constraints |
|---|---|---|
| users | Profile, credentials, role, status | Unique email; unique username |
| posts | LinkedIn post records, verification state | Unique normalised URL; index on student + publishedAt |
| metricSnapshots | Timestamped likes, comments, reposts | Index on post + capturedAt |
| pointsLedger | Awards and reversals | Unique on post + type |
| streaks | Current and longest streak per student | One document per student |
| notifications | In-app messages and read state | Index on user + read |
| auditLogs | Who did what and when | Append only |
| settings | Platform configuration | Single document |

## 9. API overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/v1/auth/register | Register a student |
| POST | /api/v1/auth/login | Authenticate |
| POST | /api/v1/auth/refresh | Rotate refresh token |
| GET | /api/v1/auth/me | Current user and status |
| POST | /api/v1/posts | Submit a LinkedIn URL |
| GET | /api/v1/posts/mine | Own posts |
| GET | /api/v1/dashboard/student | Student dashboard data |
| GET | /api/v1/leaderboard | Ranked students |
| GET | /api/v1/admin/registrations | Pending registrations |
| PATCH | /api/v1/admin/users/:id/status | Approve, reject, suspend |
| GET | /api/v1/admin/posts | Verification queue |
| PATCH | /api/v1/admin/posts/:id/review | Verify or reject a post |
| PATCH | /api/v1/admin/posts/:id/metrics | Enter or correct metrics |
| GET | /api/v1/admin/dashboard | Platform metrics |
| GET | /api/v1/admin/reports/export | CSV export |

## 10. Architecture

- Feature-based modules on both client and server. Each feature owns its routes, controllers, services, models, validation, events and tests.
- A **feature registry** (`features/index.js`) is the single place features are listed. Adding = new folder + one line. Removing = delete folder + that line.
- Features communicate through events (`post.verified` → points, streaks, notifications) and never import each other's internals.
- Feature flags in `core/config/features.js` allow turning a feature off without a deploy.
- The client builds routes, navigation and dashboard widgets from its own client registry.

## 11. Non-functional requirements

| Area | Requirement |
|---|---|
| Security | Hashed passwords, validated input, rate limits by username/user/IP, server-side authorisation |
| Privacy | Leaderboard exposes minimum data; private details visible only to owner and admins |
| Reliability | No duplicate submissions or point awards; email failures never lose data |
| Performance | API < 500 ms p95 for normal reads; paginated lists; indexed leaderboard queries |
| Scalability | Designed for 5,000 students in year 1 |
| Auditability | Approvals, reviews, score changes and setting changes recorded with actor and time |
| Accessibility | Keyboard navigation, readable contrast, clear form errors |
| Mobile | Fully usable on phones |

## 12. Rate limiting (summary)

See `docs/SECURITY.md` section 5.2 for the full table. Limits apply per username, per authenticated user and per IP.

## 13. Release plan

| Week | Deliverable |
|---|---|
| 1 | Repo, core setup, auth, seed admin, rate limiter, apply for LinkedIn API |
| 2 | Approval flow, status screens, notifications, admin queue |
| 3 | URL submission, validation, preview provider, My Posts |
| 4 | Admin verification queue, manual metrics, audit log |
| 5 | Points ledger, streaks, student dashboard |
| 6 | Leaderboard, admin dashboard, CSV export |
| 7 | Email, reminders, security review, tests, deployment |

## 14. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| LinkedIn data not accessible | Metrics incomplete | Provider abstraction, admin review, manual metrics |
| Students gaming points | Unfair leaderboard | Verification before points, duplicate checks, daily cap, audit log |
| Admin review backlog | Slow feedback | Queue filters, bulk actions |
| Account takeover | Data exposure | Rate limits, strong hashing, MFA for admins |

## 15. Decisions confirmed

| Question | Default |
|---|---|
| One college or several? | One college for v1 |
| Approval method | Manual admin approval |
| Require LinkedIn connection? | No for MVP |
| Streak based on publish or submit date? | Publish date |
| Posts per day that count | One |
| Maximum post age at submission | 2 days |
| Can students see each other's posts? | Leaderboard only |

## 16. Acceptance criteria for MVP

- An unapproved or suspended user receives 403 from every protected endpoint.
- A duplicate LinkedIn URL is rejected for any student.
- Points awarded exactly once per verified post, even if the review request is repeated.
- Streaks are correct across midnight in the configured timezone.
- Login, registration and submission rate limits return 429 with Retry-After.
- The leaderboard never exposes email addresses.
- Removing any non-core feature folder and its registry line leaves the app working.
- Every admin action appears in the audit log.
- A duplicate URL, or a post with the same publish date and time, is rejected with the correct error.
- Every form validated on client and again on server; invalid direct API requests rejected.
