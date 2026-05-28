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
| Passport.js + Google OAuth 2.0 | Social login |
| Judge0 (RapidAPI) | Remote code execution |
| Groq SDK | AI problem chat (Llama models) |
| Razorpay | Payment gateway |
| bcrypt | Password hashing |
| express-validator / Joi | Input validation |

---

## Project Structure

```
src/
  config/
    db.js               # Mongoose connection
    redis.js            # Dual-mode: Upstash REST or self-hosted Redis client
    passport.js         # Google OAuth strategy
    groq.config.js      # Groq client initialization
  controllers/          # Route handler logic
  middlewares/
    checkAuthMiddleware.js          # Decodes JWT, attaches req.user
    userMiddleware.js               # Auth + role === 'user' check
    adminMiddleware.js              # Auth + role === 'admin' check
    activeAccountMiddleware.js      # Blocks deactivated accounts
    emailVerificationMiddleware.js  # Gates actions on verified email
    premiumMiddleware.js            # Checks subscriptionType + subscriptionExpiry
    problemAccessMiddleware.js      # isPremium check + isActive check per problem
    submitCodeWaitingTimeMiddleware.js  # 10s Redis cooldown between submits
    ipRateLimitMiddleware.js        # 1000 req/hour per IP
    discussionRateLimitMiddleware.js   # 5/hr free, 20/hr premium per user
    inputValidationMiddleware.js    # express-validator error handler
    chatValidator.js                # Chat input sanitization
    requestLoggingMiddleware.js     # Dev request logging
  models/
    user.js         # User schema (auth, stats, subscription, points)
    problem.js      # Problem schema (test cases, starter code, hints)
    submission.js   # Submission result + runtime/memory
    contest.js      # Contest schema with participants + scoring
    discussion.js   # Discussion threads + replies + votes
    payment.js      # Razorpay order + verification records
    redemption.js   # Points redemption orders + delivery status
    solutionDraft.js # Auto-saved code drafts per problem-language
    feedback.js     # User feedback
    company.js      # Company metadata for problem tags
  routes/           # Express routers, one per domain
  services/
    compiler.service.js  # Local pre-compile via child_process (gcc/g++/javac)
    chat.service.js      # Groq chat logic, hint handling, solution detection
    user.service.js      # Post-solve user stat updates (points, streaks, rating)
  utils/
    validator.js         # Language ID mapping for Judge0
    problemUtility.js    # Judge0 batch submit + token polling
    groqClient.js        # Singleton Groq client
    promtGenerator.js    # Prompt building + relevance validation for AI chat
  scripts/
    seedAdmin.js         # One-time admin user seeding
  index.js              # App bootstrap, middleware wiring, error handler
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

# Razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Judge0 (via RapidAPI)
JUDGE0_API_KEY=...

# Groq
GROQ_API_KEY=...
```

**Redis mode detection:** `redis.js` checks for `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. If both are set it uses the Upstash REST client; otherwise falls back to the standard `redis` npm client. The app starts successfully even if Redis is unavailable — rate limiting and cooldowns silently no-op.

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
- Logout: token added to Redis with TTL = remaining JWT lifetime (blacklisted until natural expiry)

---

## Code Execution Pipeline

1. **Local pre-compile** (`compiler.service.js`) — runs `gcc`/`g++`/`javac` via `child_process.exec` on a temp file. Detects compilation errors before touching Judge0. If the compiler binary isn't installed locally, it returns success and defers to Judge0.
2. **Judge0 batch submit** (`problemUtility.js`) — submits all visible + hidden test cases as a batch to Judge0 via RapidAPI.
3. **Token polling** — polls Judge0 `/submissions/batch` with returned tokens until all results are ready.
4. **Result aggregation** — counts passed tests, sums runtimes, takes max memory. First non-accepted test case sets the status.
5. **User update** (`user.service.js`) — on first-time accepted submission: increments solved count by difficulty, awards points, updates streak, recalculates rating.

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

Payment verification (`POST /api/payments/verify-payment`) uses Razorpay HMAC signature verification before updating the user record. The Razorpay webhook (`POST /api/payments/webhook`) uses `express.raw()` — mounted **before** `express.json()` in `index.js` to preserve the raw body for signature verification.

---

## AI Chat Architecture

`chat.service.js` wraps Groq:

1. Loads problem from DB **excluding** `hiddenTestCases`
2. Validates message relevance via `promptGenerator.validateMessageRelevance` — non-coding/off-topic messages return a canned response without an LLM call
3. Detects "give me the full solution" phrasing and blocks it
4. If the message matches `/hint \d?/`, returns the structured hint from `problem.hints[]` directly without an LLM call
5. Otherwise builds a system prompt with problem context and sends to Groq with conversation history

---

## API Reference

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register new user |
| POST | `/login` | — | Login, issues JWT cookie |
| GET | `/check` | — | Validate current session |
| POST | `/logout` | user | Blacklist token, clear cookie |
| POST | `/admin/register` | — | Register admin account |
| DELETE | `/user/profile` | user | Delete own account |
| GET | `/google` | — | Google OAuth redirect |
| GET | `/google/callback` | — | Google OAuth callback |
| POST | `/forgot-password` | — | Send reset email |
| POST | `/reset-password` | — | Confirm reset with token |

### Problem Management — `/api/problem` (admin)
| Method | Path | Description |
|---|---|---|
| POST | `/create` | Create problem with test cases + starter code |
| PATCH | `/:id` | Update problem fields |
| DELETE | `/:id` | Delete problem |
| GET | `/:id` | Get full problem (admin view) |
| GET | `/total/solved` | Aggregated solved counts |

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
| GET | `/problem/:problemId` | Discussions for a problem |
| POST | `/` | Create discussion (rate limited) |
| PUT | `/:discussionId` | Edit own discussion |
| DELETE | `/:discussionId` | Delete own discussion |
| POST | `/:discussionId/replies` | Add reply |
| POST | `/:discussionId/vote` | Upvote/downvote |

**Admin** — `/api/admin/discussion`
| Method | Path | Description |
|---|---|---|
| GET | `/` | All discussions |
| PUT | `/:discussionId/pin` | Pin/unpin discussion |
| PUT | `/:discussionId/solution` | Mark as solution |
| DELETE | `/:discussionId/replies/:replyId` | Moderate reply |

### Profile — `/api`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:username/profile` | — | Public profile |
| GET | `/:username/problems-stats` | — | Solved counts by difficulty |
| GET | `/:username/heatmap` | — | Submission activity heatmap |
| GET | `/:username/recent-submissions` | — | Last N submissions |
| PATCH | `/profile` | user | Update own profile |
| POST | `/:username/follow` | user | Follow user |
| DELETE | `/:username/unfollow` | user | Unfollow user |

### Payments — `/api/payments`
| Method | Path | Description |
|---|---|---|
| POST | `/create-order` | Create Razorpay order |
| POST | `/verify-payment` | Verify HMAC signature, activate premium |
| POST | `/webhook` | Razorpay webhook (raw body required) |

### Contests
**Admin** — `/api/admin/contest`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create contest |
| PATCH | `/:contestId` | Update contest |
| DELETE | `/:contestId` | Delete contest |
| POST | `/:contestId/activate-problems` | Move contest problems to main set |

**User** — `/api/user/contest`
| Method | Path | Description |
|---|---|---|
| GET | `/` | All contests (upcoming/running/ended) |
| GET | `/:contestId` | Contest detail + problems |
| POST | `/:contestId/register` | Register for contest |
| POST | `/:contestId/submit/:problemId` | Contest submission |
| GET | `/:contestId/leaderboard` | Live leaderboard |

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
| `/api/chat/problem/:problemId` | POST | AI chat message |
| `/api/feedback` | POST | Submit feedback |
| `/api/theme` | POST | Save editor theme preference |
| `/api/format` | POST | Format code |

---

## Error Handling

A global error handler in `index.js` maps known error message strings to HTTP status codes:

| Error string | Status |
|---|---|
| `Too many AI requests` | 429 |
| `Problem not found` | 404 |
| `not currently available` | 403 |
| `AI service authentication failed` | 503 |
| `AI service temporarily unavailable` | 503 |
| `Invalid request to AI service` | 400 |
| anything else | 500 |

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
