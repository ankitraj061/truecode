# TrueCode Backend

Express 5 + MongoDB REST API powering the TrueCode coding platform. Handles auth, code execution, AI chat, payments, contests, and admin tools.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js (ESM) | Runtime |
| Express 5 | HTTP framework |
| Mongoose 8 | MongoDB ODM |
| Redis (Upstash / self-hosted) | JWT blacklist, rate limiting, submission cooldowns |
| JWT + HTTP-only cookies | Stateless auth |
| Passport.js + Google & GitHub OAuth 2.0 | Social login |
| Judge0 (RapidAPI) | Remote code execution |
| Groq SDK (primary) + Gemini SDK (fallback) | AI problem chat — falls back to Gemini if Groq errors with anything other than a 400 |
| Razorpay | Payment gateway |
| bcrypt | Password hashing |
| express-validator / Joi | Input validation |

---

## Project Structure

```
src/
  config/
    db.ts                # Mongoose connection
    redis.ts             # Dual-mode: Upstash REST or self-hosted Redis client
    passport.ts          # Google + GitHub OAuth strategies
    groq.config.ts       # Groq client initialization (primary AI provider)
    gemini.config.ts     # Gemini client initialization (fallback AI provider)
  controllers/           # Route handler logic
  middlewares/
    checkAuthMiddleware.ts          # Decodes JWT, attaches req.user
    userMiddleware.ts                # Auth + role === 'user' check
    adminMiddleware.ts               # Auth + role === 'admin' check
    optionalUserMiddleware.ts        # Attaches req.user if logged in, otherwise continues anonymously
    activeAccountMiddleware.ts       # Blocks deactivated accounts
    emailVerificationMiddleware.ts   # Gates actions on verified email
    premiumMiddleware.ts             # Checks subscriptionType + subscriptionExpiry
    problemAccessMiddleware.ts       # isPremium check + isActive check per problem
    submitCodeWaitingTimeMiddleware.ts  # 10s Redis cooldown between submits
    ipRateLimitMiddleware.ts         # 1000 req/hour per IP
    discussionRateLimitMiddleware.ts # 5/hr free, 20/hr premium per user
    inputValidationMiddleware.ts     # express-validator/Joi error handler
    chatValidator.ts                 # Chat input sanitization
    requestLoggingMiddleware.ts      # Dev request logging
  models/
    user.ts         # User schema (auth, stats, subscription, points)
    problem.ts      # Problem schema (test cases, starter code, hints)
    submission.ts   # Submission result + runtime/memory
    contest.ts      # Contest schema with participants + scoring
    discussion.ts   # Discussion threads + replies + votes
    payment.ts       # Razorpay order + verification records
    redemption.ts    # Points redemption orders + delivery status
    solutionDraft.ts # Auto-saved code drafts per problem-language
    feedback.ts      # User feedback
    company.ts       # Company metadata for problem tags
  routes/            # Express routers, one per domain (admin*.route.ts + user*.route.ts pairs)
  validations/
    discussionSchemas.ts  # Joi schemas for discussion create/update/reply/vote/bulk
  services/
    compiler.service.ts  # Local pre-compile via child_process (gcc/g++/javac)
    chat.service.ts       # AI chat logic — Groq primary, Gemini fallback, hint handling, solution detection
    user.service.ts       # Post-solve user stat updates (points, streaks, rating)
  utils/
    validator.ts        # Language ID mapping for Judge0
    problemUtility.ts   # Judge0 batch submit + token polling
    groqClient.ts        # Singleton Groq client
    geminiClient.ts       # Singleton Gemini client (fallback), normalizes response to Groq's shape
    promtGenerator.ts    # Prompt building + relevance validation for AI chat
    slugify.ts            # Problem title → URL slug generation
  scripts/
    seedAdmin.ts          # One-time admin user seeding
  index.ts               # App bootstrap, middleware wiring, error handler
```

---

## Environment Variables

Create `backend/.env`:

```env
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# MongoDB
DB_CONNECT_STRING=mongodb+srv://...

# JWT
JWT_SECRET_KEY=your_jwt_secret

# Redis — choose one:
# Option A: Upstash (recommended for serverless)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
# Option B: Self-hosted
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Judge0 (via RapidAPI)
JUDGE0_API_KEY=...

# Groq (primary AI provider)
GROQ_API_KEY=...

# Gemini (fallback AI provider — used if Groq errors with anything other than a 400)
GEMINI_API_KEY=...
```

**Redis mode detection:** `redis.ts` checks for `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. If both are set it uses the Upstash REST client; otherwise falls back to the standard `redis` npm client. The app starts successfully even if Redis is unavailable — rate limiting and cooldowns silently no-op.

---

## Run Locally

```bash
npm install
npm run dev       # nodemon, hot reload
```

Seed the first admin account:
```bash
npm run seed:admin
```

Health check:
```
GET /health  →  200 OK
```

---

## Authentication Model

- JWT issued on login/register, stored in an HTTP-only cookie named `token`
- `checkAuthMiddleware` verifies the JWT signature and checks Redis for token blacklist entry
- `userMiddleware` = `checkAuth` + `role === 'user'`
- `adminMiddleware` = `checkAuth` + `role === 'admin'`
- Google OAuth: `GET /api/auth/google` → passport redirect → `GET /api/auth/google/callback` → issues same JWT cookie
- GitHub OAuth: `GET /api/auth/github` → passport redirect → `GET /api/auth/github/callback` → issues same JWT cookie
- Logout: token added to Redis with TTL = remaining JWT lifetime (blacklisted until natural expiry)

---

## Code Execution Pipeline

1. **Local pre-compile** (`compiler.service.ts`) — runs `gcc`/`g++`/`javac` via `child_process.exec` on a temp file. Detects compilation errors before touching Judge0. If the compiler binary isn't installed locally, it returns success and defers to Judge0.
2. **Judge0 batch submit** (`problemUtility.ts`) — submits all visible + hidden test cases as a batch to Judge0 via RapidAPI.
3. **Token polling** — polls Judge0 `/submissions/batch` with returned tokens until all results are ready.
4. **Result aggregation** — counts passed tests, sums runtimes, takes max memory. First non-accepted test case sets the status.
5. **User update** (`user.service.ts`) — on first-time accepted submission: increments solved count by difficulty, awards points, updates streak, recalculates rating.

---

## Rate Limiting Strategy

All rate limiting is Redis-backed and fails open (if Redis is down, requests pass through).

| Middleware | Scope | Limit |
|---|---|---|
| `ipRateLimitMiddleware` | Per IP | 1000 req / hour |
| `submitCodeWaitingTimeMiddleware` | Per user | 1 submission / 10 seconds |
| `discussionRateLimitMiddleware` | Per user | 5/hr (free), 20/hr (premium) |

---

## Premium Access Control

Two middlewares layer premium protection:

- **`problemAccessMiddleware`** — fetches the problem, checks `problem.isActive`, then checks `problem.isPremium` against `req.user.subscriptionType`. Returns `{ action: 'upgrade_to_premium' }` for the frontend to handle.
- **`premiumMiddleware`** — used on non-problem premium routes; checks both `subscriptionType === 'premium'` AND `subscriptionExpiry > Date.now()`.

Payment verification (`POST /api/payments/verify-payment`) uses Razorpay HMAC signature verification before updating the user record. The Razorpay webhook (`POST /api/payments/webhook`) uses `express.raw()` — mounted **before** `express.json()` in `index.ts` to preserve the raw body for signature verification.

---

## AI Chat Architecture

`chat.service.ts` wraps Groq (primary) with a Gemini fallback:

1. Loads problem from DB **excluding** `hiddenTestCases`
2. Validates message relevance via `promptGenerator.validateMessageRelevance` — non-coding/off-topic messages return a canned response without an LLM call
3. Detects "give me the full solution" phrasing and blocks it
4. If the message matches `/hint \d?/`, returns the structured hint from `problem.hints[]` directly without an LLM call
5. Otherwise builds a system prompt with problem context and sends to Groq with conversation history
6. **Fallback:** if Groq throws an `AppError` with `statusCode !== 400` (auth failure, rate limit, or upstream/unknown error), the same messages are retried against Gemini (`geminiClient.ts`), which normalizes its response into the same `{ choices, usage, model }` shape Groq returns. A 400 from Groq (bad request) is not retried since Gemini would reject the same malformed input.

---

## API Reference

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register new user |
| POST | `/login` | — | Login, issues JWT cookie |
| GET | `/check` | — | Validate current session |
| POST | `/logout` | user | Blacklist token, clear cookie |
| POST | `/admin/register` | admin | Register admin account |
| DELETE | `/user/profile` | user | Delete own account |
| GET | `/google` | — | Google OAuth redirect |
| GET | `/google/callback` | — | Google OAuth callback |
| GET | `/github` | — | GitHub OAuth redirect |
| GET | `/github/callback` | — | GitHub OAuth callback |

### Problem Management — `/api/problem` (admin unless noted)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create` | admin | Create problem with test cases + starter code |
| PATCH | `/:id` | admin | Update problem fields |
| DELETE | `/:id` | admin | Delete problem |
| GET | `/:id` | user | Get full problem detail |
| GET | `/total/solved` | user | Aggregated solved counts |
| GET | `/submissions/:problemId` | user | Submissions for a problem |

### Admin Problem List — `/api/admin/problems`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List problems with filters/pagination (admin table view) |
| PATCH | `/:id/toggle-active` | Toggle `isActive` |

### Admin User Management — `/api/admin/users`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all users |
| GET | `/admins` | List admin accounts |
| POST | `/promote` | Promote an existing user to admin |
| POST | `/create-admin` | Create a brand new admin account |
| PATCH | `/:id/toggle-active` | Activate/deactivate a user |
| PATCH | `/:id/role` | Change a user's role |
| PATCH | `/:id` | Edit a user's details / reset password |
| DELETE | `/:id` | Permanently delete a user |

### Admin Feedback — `/api/admin/feedback`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all feedback submissions |
| PATCH | `/:id/status` | Update feedback status |

### User Problems — `/api/user/problem`
| Method | Path | Description |
|---|---|---|
| GET | `/all` | Paginated problem list with filters |
| GET | `/:problemSlug` | Problem detail (respects premium gate) |
| GET | `/companies` | All company tags |
| GET | `/topics` | All topic tags |
| POST | `/save/:problemId` | Toggle save/unsave problem |
| GET | `/:problemId/solution` | Reference solution (premium or post-contest) |
| GET | `/:problemId/editorial` | Editorial content |

### Code Execution — `/api`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/submit/:problemId` | user + cooldown | Submit code, run all test cases |
| POST | `/run/:problemId` | user | Run code on visible test cases only |

### Submissions — `/api`
| Method | Path | Description |
|---|---|---|
| GET | `/problems/:problemId/submissions` | User's submissions for a problem |
| GET | `/submissions/:submissionId` | Single submission detail |
| POST | `/submissions/:submissionId/notes` | Add/update notes on a submission |

### Drafts — `/api`
| Method | Path | Description |
|---|---|---|
| POST | `/problems/:problemId/draft` | Save code draft (per problem + language) |
| GET | `/problems/:problemId/draft` | Load latest draft |
| DELETE | `/problems/:problemId/draft` | Delete draft |
| GET | `/drafts` | All drafts for current user |

### Discussions
**User** — `/api/user/discussion`
| Method | Path | Description |
|---|---|---|
| GET | `/my` | Current user's own discussions |
| GET | `/problem/:problemId` | Discussions for a problem |
| GET | `/:discussionId` | Single discussion detail |
| POST | `/` | Create discussion (rate limited) |
| PUT | `/:discussionId` | Edit own discussion |
| DELETE | `/:discussionId` | Delete own discussion |
| POST | `/:discussionId/replies` | Add reply |
| PUT | `/:discussionId/replies/:replyId` | Edit own reply |
| DELETE | `/:discussionId/replies/:replyId` | Delete own reply |
| POST | `/:discussionId/vote` | Upvote/downvote discussion |
| POST | `/:discussionId/replies/:replyId/vote` | Upvote/downvote reply |

**Admin** — `/api/admin/discussion`
| Method | Path | Description |
|---|---|---|
| GET | `/` | All discussions (admin filters) |
| GET | `/stats` | Discussion statistics |
| GET | `/:discussionId` | Single discussion (admin view) |
| POST | `/` | Create discussion |
| PUT | `/:discussionId` | Update discussion |
| DELETE | `/:discussionId` | Delete discussion |
| PUT | `/:discussionId/pin` | Pin/unpin discussion |
| PUT | `/:discussionId/solution` | Mark as solution |
| DELETE | `/:discussionId/replies/:replyId` | Moderate (delete) reply |
| POST | `/bulk` | Bulk discussion actions |

### Profile — `/api`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile/username-check` | — | Check username availability |
| GET | `/:username/profile` | — | Public profile |
| GET | `/:username/problems-stats` | — | Solved counts by difficulty |
| GET | `/:username/heatmap` | — | Submission activity heatmap (optional `?year=`) |
| GET | `/:username/recent-submissions` | — | Last N submissions |
| PATCH | `/profile` | user | Update own profile |
| POST | `/:username/follow` | user | Follow user |
| DELETE | `/:username/unfollow` | user | Unfollow user |
| GET | `/:username/follow-status` | user | Whether current user follows `:username` |

### Payments — `/api/payments`
| Method | Path | Description |
|---|---|---|
| POST | `/create-order` | Create Razorpay order |
| POST | `/verify-payment` | Verify HMAC signature, activate premium |
| GET | `/my-transactions` | Current user's payment/transaction history |
| POST | `/:paymentId/resume` | Resume a still-reserved pending order |
| POST | `/:paymentId/cancel` | Cancel a still-pending order |
| POST | `/webhook` | Razorpay webhook (raw body required) |

### Contests
**Admin** — `/api/admin/contest`
| Method | Path | Description |
|---|---|---|
| GET | `/available-problems` | Problems eligible to add to a contest |
| POST | `/` | Create contest |
| GET | `/` | List contests (admin view) |
| GET | `/:contestId` | Contest detail (admin view) |
| PATCH | `/:contestId` | Update contest |
| DELETE | `/:contestId` | Delete contest |

**User** — `/api/user/contest`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/list` | optional | All contests (upcoming/running/ended) |
| GET | `/my` | user | Contests the current user has registered for |
| GET | `/:contestId` | optional | Contest detail + problems |
| GET | `/:contestId/leaderboard` | optional | Live leaderboard |
| POST | `/:contestId/register` | user | Register for contest |
| GET | `/:contestId/problem/:problemId` | user | Contest problem detail |
| POST | `/:contestId/submit/:problemId` | user + cooldown | Contest submission |

### Points & Redemption
| Route | Method | Description |
|---|---|---|
| `/api/user/points` | GET | Current points balance |
| `/api/redeem` | POST | Submit redemption order |
| `/api/redeem` | GET | User's own orders |
| `/api/admin/redemptions` | GET | All orders |
| `/api/admin/redemptions/:id/status` | PATCH | Update order status |

### Misc
| Route | Method | Description |
|---|---|---|
| `/api/chat/problem/:problemId` | POST | AI chat message (Groq, falls back to Gemini) |
| `/api/feedback` | POST | Submit feedback |
| `/api/theme` | POST | Save editor theme preference |
| `/api/format` | POST | Format code |
| `/api/last/:problemId` | GET | User's last submission for a problem |

---

## Error Handling

A global error handler in `index.ts` reads `AppError.statusCode`/`code` (set by the throwing service) to build the response. Known AI-related codes from `groqClient.ts`/`geminiClient.ts`:

| Error code | Status | Meaning |
|---|---|---|
| `AI_AUTH_FAILED` | 503 | Provider rejected our API key (server misconfiguration, not user-fixable) |
| `AI_UPSTREAM_ERROR` | 503 | Provider's own service is down (500/502/503 from them) |
| `AI_UNKNOWN_ERROR` | 503 | Unrecognized provider error |
| (rate limit) | 429 | Too many AI requests — `TooManyRequestsError` |
| (bad request) | 400 | Invalid request to AI service — not retried against the fallback provider |

Other errors (`NotFoundError`, `ForbiddenError`, etc.) map to 404/403 the same way via their own `statusCode`.

---

## Data Models Overview

### User
- Auth: `emailId`, `passwordHash`, `googleId`, `authProvider`
- Stats: `rating`, `maxRating`, `globalRank`, `problemsSolved[]`
- Subscription: `subscriptionType` (`free`|`premium`), `subscriptionExpiry`
- Social: `following[]`, `followers[]`, `savedProblems[]`
- Gamification: `points`, `streak`, `badges[]`

### Problem
- Content: `title`, `slug`, `description`, `difficulty`, `tags`, `companies`, `constraints`, `hints[]`
- Test data: `visibleTestCases[]`, `hiddenTestCases[]`
- Code: `startCode[]` (per language), `referenceSolution[]`
- Flags: `isActive`, `isPremium`

### Submission
- Links: `userId`, `problemId`, `contestId` (optional)
- Code: `code`, `language`
- Results: `status`, `testCasesPassed`, `totalTestCases`, `runtime`, `memory`
- Extra: `notes`

### Contest
- Schedule: `startTime`, `endTime`, `duration`
- Content: `problems[]`, `problemScores[]`
- Participation: `participants[]` with `rank`, `score`, `penalty`
- Status: `upcoming` | `running` | `ended`

### Redemption
- `userId`, `productId`, `productName`, `pointsSpent`
- `address` (embedded: name, phone, street, city, state, pincode)
- `status`: `pending → packed → shipped → out_for_delivery → delivered | cancelled`
- `statusHistory[]` for full audit trail
