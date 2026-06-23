# TrueCode

A full-stack LeetCode-style competitive programming platform. Users solve problems, compete in contests, earn points, redeem rewards, and get AI-powered hints — all backed by a real code execution engine.

**Live:** [truecode.shop](https://truecode.shop)

---

## Repository Layout

```
truecode/
├── frontend/   # Next.js 15 + React 19 + TypeScript
└── backend/    # Node.js + Express 5 + MongoDB
```

---

## Core Features

### Problem Solving
- Monaco editor with JavaScript, Python, Java, C++, and C support
- Code is run against visible test cases via Judge0 (real remote execution)
- On submit, code hits **both** visible and hidden test cases via Judge0 batch API
- Local pre-compilation (gcc/g++/javac) before sending to Judge0 to catch syntax errors fast
- Accepted status tracks passed test count, total runtime (sum), and peak memory (max)
- 10-second Redis cooldown per user between submissions to prevent spam

### AI Chat Assistant
- Groq LLM (Llama) embedded per problem workspace, with automatic fallback to Gemini if Groq is unavailable (auth failure, rate limit, or upstream error)
- Validates message relevance — off-topic questions get a short redirect response
- Detects "give me the solution" requests and refuses full solutions
- Structured hints pulled from the problem's `hints[]` field if available
- Hidden test cases are never passed to the AI context

### Authentication
- Email/password login with bcrypt + JWT stored in HTTP-only cookies
- Google and GitHub OAuth via Passport.js (stores `googleId`/`githubId`, `authProvider`)
- Logout blacklists the JWT token in Redis until it expires
- Email verification middleware gates certain actions on unverified accounts

### Premium Subscriptions
- Razorpay payment gateway (monthly / yearly plans)
- Webhook-verified payment confirmation updates `subscriptionType: 'premium'` + `subscriptionExpiry`
- `premiumMiddleware` checks both `subscriptionType === 'premium'` AND `subscriptionExpiry > now`
- Premium problems locked behind `problemAccessMiddleware` — returns `upgrade_to_premium` action for the frontend to handle

### Contests
- Admin creates contests with start/end times, problems list, and per-problem scores
- Participants register and solve problems in an isolated contest workspace
- Scoring: configurable per-problem or derived from difficulty (easy=1, medium=2, hard=3)
- Penalty system for incorrect submissions
- Live leaderboard during contest; editorial/solutions locked until contest ends
- After contest ends, admin can activate contest problems to the main problem set

### Points & Rewards
- Users earn points for accepted submissions
- Points can be redeemed for physical rewards (t-shirts, stickers, etc.) through the `/redeem` page
- Admin manages redemption orders with a status pipeline: `pending → packed → shipped → out_for_delivery → delivered`

### Discussions
- Per-problem discussion threads with replies, voting, and pinning
- Rate limited: 5 posts/hour (free) vs 20 posts/hour (premium) via Redis counter

### Admin Panel
- Create/edit/delete problems with visible + hidden test cases, starter code, and reference solutions
- Manage users (promote to admin, change role, activate/deactivate, edit/delete), contests, redemption orders, discussions (stats, bulk actions, pin/solution marking), and feedback
- Admin seeding script: `npm run seed:admin`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4, Redux Toolkit, Framer Motion, Monaco Editor |
| Backend | Node.js, Express 5, Mongoose (MongoDB), Redis (Upstash or self-hosted) |
| Code Execution | Judge0 (via RapidAPI) |
| AI | Groq SDK (Llama models, primary) + Gemini SDK (fallback) |
| Payments | Razorpay |
| OAuth | Passport.js + Google & GitHub OAuth 2.0 |
| Deployment | truecode.shop |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)
- Redis (Upstash or local)
- Judge0 API key (RapidAPI)
- Groq API key (+ optional Gemini API key for AI fallback)
- Razorpay account (for payments)
- Google and/or GitHub OAuth credentials (for social login)

### 1. Backend

```bash
cd backend
npm install
# create .env — see backend/README.md for all variables
npm run dev        # nodemon, port from .env
```

### 2. Frontend

```bash
cd frontend
npm install
# create .env.local — see frontend/README.md for all variables
npm run dev        # http://localhost:3000
```

### 3. Seed Admin User

```bash
cd backend
npm run seed:admin
```

---

## Environment Files

- Backend: `backend/.env` — see [backend/README.md](./backend/README.md)
- Frontend: `frontend/.env.local` — see [frontend/README.md](./frontend/README.md)

---

## How Key Flows Work

### Code Submission Flow
```
User submits → 10s Redis cooldown check → Local pre-compile (gcc/g++/javac)
  → Judge0 batch submit (visible + hidden test cases)
  → Poll Judge0 for results → Calculate pass/fail + runtime/memory
  → Update user stats + problem solved status → Return result to frontend
```

### Premium Gate Flow
```
Request hits route → userMiddleware (auth) → problemAccessMiddleware
  → checks problem.isPremium + user.subscriptionType
  → if locked: returns { action: 'upgrade_to_premium' }
  → frontend reads action field and redirects to /premium
```

### AI Chat Flow
```
User sends message → validate message is problem-relevant
  → check if asking for full solution (block)
  → check if asking for hint (return structured hint from DB)
  → else: send message + problem context (no hidden tests) to Groq
  → if Groq fails (non-400 error): retry the same request against Gemini
  → return response
```
