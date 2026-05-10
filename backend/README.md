# LeetCode-Style Backend API

Express + MongoDB backend for coding problems, submissions, discussions, profile features, payments, and AI chat support.

## Tech Stack
- Node.js (ES modules)
- Express 5
- MongoDB + Mongoose
- Redis (token blacklist, caching support)
- JWT auth via HTTP-only cookies
- Google OAuth (`passport-google-oauth20`)
- Razorpay payments
- Judge0 (code execution)
- Groq (AI problem chat)

## Project Structure
```text
src/
  config/         # DB, Redis, Passport, Groq config
  controllers/    # Route handlers
  middlewares/    # Auth, validation, rate limiting, account checks
  models/         # Mongoose schemas
  routes/         # API route modules
  services/       # Compiler, chat, user update services
  utils/          # Validators, Judge0 helpers, prompt helpers
  index.js        # App bootstrap
```

## Environment Variables
Create a `.env` file in the project root with:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

DB_CONNECT_STRING=<mongodb-connection-string>
JWT_SECRET_KEY=<jwt-secret>

REDIS_HOST=<redis-host>
REDIS_PORT=<redis-port>
REDIS_PASSWORD=<redis-password>

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>

RAZORPAY_KEY_ID=<razorpay-key-id>
RAZORPAY_KEY_SECRET=<razorpay-key-secret>
RAZORPAY_WEBHOOK_SECRET=<razorpay-webhook-secret>

JUDGE0_API_KEY=<rapidapi-key-for-judge0>
GROQ_API_KEY=<groq-api-key>
```

## Run Locally
```bash
npm install
node src/index.js
```

Health check:
```http
GET /health
```

## Auth Model
- Auth token is stored in cookie: `token`
- Most protected routes use:
  - `checkAuth` (authenticated user)
  - `userMiddleware` (authenticated + role `user`)
  - `adminMiddleware` (authenticated + role `admin`)
- Logout blacklists JWT in Redis until token expiry

## API Routes (Mounted Base Paths)

### Auth (`/api/auth`)
- `POST /register`
- `POST /login`
- `GET /check`
- `POST /logout`
- `POST /admin/register`
- `DELETE /user/profile`
- `GET /google`
- `GET /google/callback`

### Problem Management (`/api/problem`)
- `POST /create` (admin)
- `PATCH /:id` (admin)
- `DELETE /:id` (admin)
- `GET /:id` (user)
- `GET /total/solved` (user)
- `GET /submissions/:problemId` (user)

### Submission/Run (`/api`)
- `POST /submit/:problemId`
- `POST /run/:problemId`
- `GET /problems/:problemId/submissions`
- `GET /submissions/:submissionId`
- `POST /submissions/:submissionId/notes`

### User Problems (`/api/user/problem`)
- `GET /companies`
- `GET /topics`
- `POST /save/:problemId`
- `GET /all`
- `GET /:problemSlug`
- `GET /:problemId/solution`
- `GET /:problemId/editorial`

### Discussions
User discussions (`/api/user/discussion`)
- `GET /my`
- `GET /problem/:problemId`
- `GET /:discussionId`
- `POST /`
- `PUT /:discussionId`
- `DELETE /:discussionId`
- `POST /:discussionId/replies`
- `PUT /:discussionId/replies/:replyId`
- `DELETE /:discussionId/replies/:replyId`
- `POST /:discussionId/vote`
- `POST /:discussionId/replies/:replyId/vote`

Admin discussions (`/api/admin/discussion`)
- `GET /`
- `GET /stats`
- `GET /:discussionId`
- `POST /`
- `PUT /:discussionId`
- `DELETE /:discussionId`
- `PUT /:discussionId/pin`
- `PUT /:discussionId/solution`
- `DELETE /:discussionId/replies/:replyId`
- `POST /bulk`

### Profile (`/api`)
Public:
- `GET /profile/username-check`
- `GET /:username/profile`
- `GET /:username/problems-stats`
- `GET /:username/heatmap`
- `GET /:username/recent-submissions`

Protected:
- `PATCH /profile`
- `POST /:username/follow`
- `DELETE /:username/unfollow`
- `GET /:username/follow-status`

### Theme / Code Tools (`/api`)
- `POST /theme`
- `POST /format`
- `GET /last/:problemId`

### Drafts (`/api`)
- `POST /problems/:problemId/draft`
- `GET /problems/:problemId/draft`
- `DELETE /problems/:problemId/draft`
- `GET /drafts`

### Feedback (`/api/feedback`)
- `POST /`
- `GET /`

### Chat (`/api/chat`)
- `POST /problem/:problemId`

### Payments (`/api/payments`)
- `POST /create-order`
- `POST /verify-payment`
- `POST /webhook`

## Notes
- CORS is configured for:
  - `http://localhost:3000`
  - `https://localhost:3000`
  - `https://truecode.shop`
  - `https://www.truecode.shop`
- Payment webhook in `src/index.js` uses `express.raw({ type: 'application/json' })`.
- There is no dedicated start script in `package.json` yet; app entry is `src/index.js`.
