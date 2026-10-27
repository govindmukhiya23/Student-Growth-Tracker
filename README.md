# Student Growth Tracker

A production-ready habit tracking and leaderboard platform designed to help students build a consistent professional posting presence on LinkedIn.

## 🚀 Key Features

- **LinkedIn Post Submissions**: Direct support for standard post links and `lnkd.in` short URLs.
- **Auto-Approval & Verification**: Immediate credit and verification on post submission with automatic OpenGraph metadata extraction.
- **Streaks & Leaderboards**: Dynamic daily streak calculations and campus-wide leaderboards.
- **Admin Verification & Reporting**: Admin controls for student account approvals, post review, and anti-formula CSV report exports.
- **Security**: Strict SSRF prevention with private IP rejection, token authorization, password hashing, and rate limiting.

## 🛠 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, TanStack Query, Recharts, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Redis.
- **Testing**: Vitest with unit and integration test coverage.

## 📦 Project Structure

```text
growth-tracker/
├── client/     # React frontend application
├── server/     # Express REST API backend
├── shared/     # Shared Zod schemas and validation rules
└── docs/       # Architecture & Product Requirements (PRD)
```

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js**: v20 or higher
- **MongoDB**: Local instance or MongoDB Atlas URI
- **Redis**: Local or cloud Redis instance

### 2. Environment Setup
Copy the example environment file in `server`:
```bash
cp server/.env.example server/.env
```
Fill in your `MONGODB_URI`, `REDIS_URL`, JWT secrets, and `RESEND_API_KEY`.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Servers
```bash
npm run dev
```
- Client runs on: `http://localhost:5173`
- Backend API runs on: `http://localhost:5000`

### 5. Running Tests
```bash
npm test
```
