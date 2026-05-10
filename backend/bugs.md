# TrueCode Backend — Bug Report

Scanned files: all controllers, middlewares, models, routes, and services.
Last updated: 2026-04-21

---

## 1. Authentication & Authorization

### BUG-B01 · **CRITICAL** — Null-pointer crash on login when email doesn't exist
**File:** `src/controllers/userAuth.controller.js` · Line **157**

```js
// BUGGY
const user = await User.findOne({ emailId });
const isPasswordValid = await bcrypt.compare(password, user.password); // CRASHES if user is null
```

`User.findOne` returns `null` for unknown emails. Calling `user.password` on null throws
`TypeError: Cannot read properties of null` — the catch block sends this raw error message
to the client, leaking that the email doesn't exist (user-enumeration risk).

**Fix:** Check `if (!user) throw new Error('Invalid credentials');` **before** calling `bcrypt.compare`.

---

### BUG-B02 · **HIGH** — JWT cookie set without security flags on register & login
**File:** `src/controllers/userAuth.controller.js` · Lines **102, 139, 175**

```js
// BUGGY — no httpOnly, no secure, no sameSite
res.cookie('token', token, { maxAge: 7 * 24 * 60 * 60 * 1000 });
```

The Google OAuth callback (line 61–66) correctly sets `httpOnly: true`, `secure`, and
`sameSite: 'lax'`, but the local register and login endpoints do not.  
Without `httpOnly`, JavaScript can read the auth cookie → XSS token theft.  
Without `sameSite`, cross-site requests carry the cookie → CSRF.

**Fix:** Apply the same cookie options used in `googleCallback` to all cookie-setting calls.

---

### BUG-B03 · **HIGH** — Admin self-registration bypass
**File:** `src/controllers/userAuth.controller.js` · Lines **119–122**

```js
let role = 'user';
if (req.body.role == 'admin') {
    role = 'admin';   // Anyone who calls this route becomes an admin!
}
```

The route `/auth/admin/register` is guarded by `adminMiddleware`, which is correct. However,
the *body* is trusted to escalate the role. Any existing admin can create new admins without
restriction. There is no secondary confirmation, super-admin check, or audit log.

**Fix:** Hard-code `role = 'admin'` and remove the conditional; log the action.

---

### BUG-B04 · **MEDIUM** — Logout cookie-clear is unreliable
**File:** `src/controllers/userAuth.controller.js` · Line **211**

```js
res.cookie('token', null, { expires: new Date(Date.now()) });
// Date.now() is the current millisecond — the expiry is essentially "right now"
// Some browsers/CDNs may treat this as already-expired or behave inconsistently
```

**Fix:** Use `maxAge: 0` or `expires: new Date(0)` for a reliably-past date.

---

### BUG-B05 · **MEDIUM** — Middleware returns wrong HTTP status codes
**Files:**
- `src/middlewares/userMiddleware.js` · Line **29** → `res.status(400)` for token errors
- `src/middlewares/adminMiddleware.js` · Line **32** → `res.status(400)` for role/token errors

`400 Bad Request` is wrong for auth failures. RFC 7235 requires:
- `401 Unauthorized` when credentials are missing/invalid
- `403 Forbidden` when the user is authenticated but lacks permission

Clients (and frontend redirect logic) depend on correct HTTP status codes.

**Fix:** Return 401 for missing/invalid token, 403 for insufficient role.

---

### BUG-B06 · **MEDIUM** — Admin middleware checks role before token blacklist
**File:** `src/middlewares/adminMiddleware.js` · Lines **19–25**

The blacklist check happens *after* the role check. A revoked admin token (e.g., after logout)
still passes the role check; only then is it blocked. Order should be: verify → blacklist →
role — so any revoked token is rejected before role privilege is evaluated.

---

### BUG-B07 · **LOW** — Subscription expiry not checked in discussion/problem access middleware
**Files:** `src/controllers/userDiscussion.controller.js` Line **27**,
`src/controllers/userProblem.controller.js` Line **419**

```js
if (problem.isPremium && req.user.subscriptionType !== 'premium') { ... }
```

`req.user` is hydrated from the DB by `userMiddleware`, but the expiry field is only
checked inside `checkAuthFunction`. A user whose subscription expired yesterday still
has `subscriptionType = 'premium'` in the DB until they call `/auth/check`.

**Fix:** Inline a quick expiry check in `userMiddleware`, or create a shared helper:
```js
const isPremiumActive = user.subscriptionType === 'premium' &&
    user.subscriptionExpiry && user.subscriptionExpiry > new Date();
```

---

## 2. Submission & Code Execution

### BUG-B08 · **HIGH** — Submission record created before Judge0 responds
**File:** `src/controllers/submit.controller.js` · Line **49**

A `Submission` document is written with `status: 'pending'` **before** Judge0 is called.
If `submitBatch` or `submitToken` throws (network error, Judge0 timeout), the submission
stays as `'pending'` forever — polluting the submission history and corrupting stats.

**Fix:** Move `Submission.create(...)` to after  Judge0 results are processed and the
final status is known, or implement a cleanup on failure.

---

### BUG-B09 · **HIGH** — Contest double-scoring on re-submission
**File:** `src/controllers/submit.controller.js` · Lines **524–543**

When a contest problem is accepted, the participant's score is incremented with no check
for whether this problem was already solved. A participant can submit the same accepted
problem multiple times and accumulate unlimited score.

**Fix:** Check if any prior `accepted` submission for this `contestId + problemId + userId`
exists before adding to the score.

---

### BUG-B10 · **MEDIUM** — `runProblem` uses the same 10-second cooldown as `submitProblem`
**File:** `src/routes/submit.route.js` · Line **11**

```js
submitRouter.post('/run/:problemId', submitCodeWaitingTimeMiddleware, runProblem);
```

Running test cases triggers the 10-second cooldown shared with submitting. Users cannot
run code more than once every 10 seconds, making iterative testing very slow.

**Fix:** Use a separate (shorter, e.g., 3-second) cooldown key for run operations, or
remove the cooldown from run entirely.

---

### BUG-B11 · **MEDIUM** — `runProblem` returns `-Infinity` for execution time when no tests run
**File:** `src/controllers/submit.controller.js` · Line **359**

```js
const maxTime = Math.max(...processedResults.map(r => r.executionTime));
// If processedResults is empty → Math.max() → -Infinity
```

**Fix:** Guard with `processedResults.length > 0 ? Math.max(...) : 0`.

---

### BUG-B12 · **LOW** — Compiler service Java cleanup uses wrong case comparison
**File:** `src/services/compiler.service.js` · Line **52**

```js
if (language === "java") {   // strict equality, case-sensitive
```

But `language.toLowerCase()` is used in the `switch` above (line 17). If the caller
passes `"Java"` or `"JAVA"`, the switch correctly compiles it but the cleanup block
never deletes the `.class` file, leaking temporary files.

**Fix:** `if (language.toLowerCase() === "java")`.

---

## 3. Rate Limiting

### BUG-B13 · **HIGH** — IP rate limiter resets the TTL on every request (window slipping)
**File:** `src/middlewares/ipRateLimitMiddleware.js` · Line **20**

```js
await redisClient.setEx(redisKey, 3600, newCount);
```

`setEx` replaces the key and **resets the TTL** to 3600 seconds on every single request.
An attacker sending 999 requests every hour – 1 second will never hit the limit; the
window always restarts. The effective limit is never enforced.

**Fix:** Use `INCR` + `EXPIRE` (set expire only once on creation):
```js
const count = await redisClient.incr(redisKey);
if (count === 1) await redisClient.expire(redisKey, 3600);
if (count > maxRequests) return res.status(429).json({ error: '...' });
```

---

### BUG-B14 · **MEDIUM** — Rate limiters fail-closed on Redis errors, blocking all traffic
**Files:**
- `src/middlewares/ipRateLimitMiddleware.js` · Line **23–25** → `res.status(400)`
- `src/middlewares/submitCodeWaitingTimeMiddleware.js` · Line **23–25** → `res.status(400)`

If Redis is down, every request returns an error — the app becomes completely unusable.
Standard practice is to **fail-open** (allow the request) when the rate-limit store is
unavailable, and log the Redis error for alerting.

---

## 4. Profile & Social Features

### BUG-B15 · **MEDIUM** — `updateProfile`, `followUser`, `unfollowUser` use `req.user.id` instead of `req.user._id`
**File:** `src/controllers/profile.controller.js` · Lines **45, 348, 403, 458**

```js
const currentUserId = req.user.id;   // uses Mongoose virtual 'id' (string)
```

The rest of the codebase consistently uses `req.user._id` (ObjectId). While Mongoose's
`.id` virtual does exist, mixing string IDs and ObjectIds in DB queries silently passes
but breaks if any query expects an ObjectId type (e.g., `$ne: userId`).

**Fix:** Use `req.user._id` throughout.

---

### BUG-B16 · **MEDIUM** — `followUser` uses `$push` instead of `$addToSet` — allows duplicate followers
**File:** `src/controllers/profile.controller.js` · Lines **376–384**

The controller checks for duplicates but uses two separate queries (check + update) without
a transaction. A race condition (two simultaneous follow requests) can insert the same user
twice into the `following`/`followers` arrays.

**Fix:** Use `$addToSet` instead of `$push`.

---

### BUG-B17 · **LOW** — Public profile endpoint exposes emailId
**File:** `src/controllers/profile.controller.js` · Line **12–13, 22**

```js
const user = await User.findOne({ username })
    .select('firstName lastName username emailId bio ...')
```

`emailId` is included in the select and returned in the response from a **public** route.
Users should not be able to enumerate other users' email addresses.

**Fix:** Remove `emailId` from the select projection and the `profileData` response object.

---

### BUG-B18 · **LOW** — `getRecentSubmissions` has no pagination — always returns last 10
**File:** `src/controllers/profile.controller.js` · Line **328–333**

`.limit(10)` is hardcoded with no way for the client to request more or paginate.

---

## 5. Discussion

### BUG-B19 · **MEDIUM** — Vote comparison uses `Array.includes` on ObjectId arrays (always false)
**File:** `src/controllers/userDiscussion.controller.js` · Lines **292–294, 356–357**

```js
const isInUpvotes = discussion.upvotes.includes(userId);
```

`discussion.upvotes` is an array of Mongoose ObjectIds. `userId` is also an ObjectId.
`Array.prototype.includes` uses strict equality (`===`), which compares references for
objects — two different ObjectId instances with the same value are **not** `===`.

This means upvote/downvote toggle logic always thinks the user hasn't voted, so users
can vote multiple times (adding duplicates with `$addToSet` saves correctly, but the
in-memory `isInUpvotes` check for toggling is always wrong).

**Fix:** Use `.some(id => id.toString() === userId.toString())`.

---

### BUG-B20 · **LOW** — `getProblemDiscussions` pagination uses uncoerced string `limit`
**File:** `src/controllers/userDiscussion.controller.js` · Lines **42–43**

```js
.limit(limit * 1)
.skip((page - 1) * limit)
```

`limit * 1` coerces to number but `(page - 1) * limit` does string multiplication if
`page` is a string: `("2" - 1) * "20"` = `20` (works) but is fragile. Use `parseInt`.

---

### BUG-B21 · **LOW** — `addReply` doesn't populate `problemId` on final response
**File:** `src/controllers/userDiscussion.controller.js` · Lines **249–254**

The updated discussion is returned but `problemId` is not populated — the client receives
a raw ObjectId. All other endpoints populate `problemId`.

---

## 6. Data Models

### BUG-B22 · **LOW** — Problem model has placeholder default URLs
**File:** `src/models/problem.js` · Lines **101–106**

```js
videoUrl:     { type: String, default: 'xyx.com' },
thumbnailUrl: { type: String, default: 'xyx.com' },
```

These defaults will be persisted to the database for every problem created without
explicit values, making editorial queries unreliable (is URL missing or is it just `xyx.com`?).

**Fix:** Default to `''` or `null`, and handle absence in-app.

---

### BUG-B23 · **LOW** — Problem model has no unique constraint on `title`
**File:** `src/models/problem.js`

Two problems with identical titles can be created. `slug` is unique but `title` is not.
This creates confusing duplicates in the problem list.

---

### BUG-B24 · **LOW** — User model `savedProblems` uniqueness validator runs client-side only
**File:** `src/models/user.js` · Lines **145–150**

Mongoose schema validators don't run on `findByIdAndUpdate` by default (unless
`{ runValidators: true }` is explicitly passed). The uniqueness check on `savedProblems`
is therefore bypassed by the update operations in `toggleSaveProblem`, which uses
`$addToSet` (safe), but any future direct update would bypass it.

---

## 7. Problem Controller

### BUG-B25 · **LOW** — Pagination in `getAllProblemsForUser` uses uncoerced `page` and `limit`
**File:** `src/controllers/userProblem.controller.js` · Lines **309, 326–329**

```js
{ $skip: (page - 1) * parseInt(limit) }               // 'page' is still a string
hasNext: page * limit < totalCount                     // string * string — works but fragile
totalPages: Math.ceil(totalCount / limit)              // 'limit' not parseInt'd here
```

**Fix:** Destructure with explicit `parseInt`: `const page = parseInt(req.query.page) || 1`.

---

## 8. Security — General

### BUG-B26 · **HIGH** — No input sanitization against NoSQL injection
No middleware strips or sanitizes MongoDB operators (`$where`, `$gt`, etc.) from request
bodies. A malformed login body like `{ "emailId": { "$gt": "" } }` could bypass email
matching in some Mongoose query patterns.

**Fix:** Use a sanitization library such as `express-mongo-sanitize`.

---

### BUG-B27 · **MEDIUM** — `FRONTEND_URL` is used in redirects without validation
**File:** `src/controllers/userAuth.controller.js` · Lines **24, 27, 31, 69, 72**

If `process.env.FRONTEND_URL` is not set, `redirect` targets become `undefined/login`,
which may open redirect vulnerabilities or crash the process.

**Fix:** Validate `FRONTEND_URL` at startup; fail-fast if it's missing.

---

### BUG-B28 · **LOW** — `deleteUserAccount` does not clear the session cookie
**File:** `src/controllers/userAuth.controller.js` · Lines **221–231**

The account is deleted but the JWT cookie is not cleared and not blacklisted. The
deleted user's token remains valid until it expires (7 days).

**Fix:** Add `res.cookie('token', null, { maxAge: 0 })` and blacklist the token.

---

*End of backend bug report.*
