# TrueCode Frontend

Next.js 15 frontend for the TrueCode coding platform — problem solving, contests, AI chat, premium subscriptions, and a rewards system.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | Framework + routing |
| React 19 | UI |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling (CSS variables for theming) |
| Redux Toolkit + React Redux | Global state (auth, user data) |
| Monaco Editor (`@monaco-editor/react`) | Code editor |
| Framer Motion | Scroll animations, transitions |
| Axios | HTTP client |
| Lucide React | Icons |
| react-resizable-panels | Split-pane editor layout |
| react-activity-heatmap | Submission heatmap on profiles |
| canvas-confetti | Accepted submission celebration |
| next-themes | Dark/light mode |

---

## Project Structure

```
src/
  app/
    layout.tsx                     # Root layout — wraps NavbarWrapper + Providers
    page.tsx                       # Route: / — renders Home or HomeWithoutLogin
    Home.tsx                       # Logged-in dashboard
    HomeWithoutLogin.tsx           # Marketing landing page
    globals.css                    # Global keyframe animations + CSS variable definitions
    providers/                     # Client providers (Redux store, theme)
    accounts/
      login/                       # /accounts/login
      signup/                      # /accounts/signup
      forgot-password/             # /accounts/forgot-password
    problems/
      page.tsx                     # /problems — problem listing
      Problems.tsx                 # Problems list with filter sidebar
      [slug]/
        layout.tsx                 # Problem workspace layout (split pane)
        page.tsx                   # Redirects /problems/[slug] → description
        description/               # Problem statement + examples
        editorial/                 # Editorial (locked until solved or premium)
        solutions/                 # Reference solutions (premium gate)
        submissions/               # User's submission history
        chatai/                    # AI chat assistant
        utils/
          Navbar.tsx               # Workspace navbar (timer, theme, submit button)
          CodeEditorSection.tsx    # Monaco editor + language/theme picker
          ProblemSection.tsx       # Problem statement renderer
          TestCasesSection.tsx     # Run results panel
          ProblemListSidebar.tsx   # In-workspace problem list
          useRunCode.ts            # Hook: run/submit code logic
          types.ts                 # Shared workspace types
    contests/
      page.tsx                     # /contests — tabs: Upcoming, Running, Past
      [contestId]/
        page.tsx                   # Contest detail (summary, problems, leaderboard)
        problem/[problemId]/
          description/             # Contest problem workspace
    premium/
      page.tsx                     # /premium — plan cards + Razorpay checkout
    events/
      page.tsx                     # /events — coding events calendar (Clist API)
    redeem/
      page.tsx                     # /redeem — rewards catalog
    my-orders/
      page.tsx                     # /my-orders — redemption order tracking
    [username]/
      page.tsx                     # /:username — public profile
    admin/
      layout.tsx                   # Admin layout (guards non-admin users)
      create-admins/               # Create admin accounts
      problems/                    # Problems list + actions
      create-problem/              # Create problem form
      contests/                    # Contests list + actions
        [contestId]/edit/          # Edit contest
      redemptions/                 # Manage redemption orders
  components/                      # Shared UI components
  slices/
    authSlice.ts                   # Redux slice: user, isAuthenticated, loading
  store/                           # Redux store config
  hooks/                           # Custom React hooks
  lib/                             # Utility helpers
```

---

## Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_CLIST_USERNAME=your_clist_username
NEXT_PUBLIC_CLIST_API_KEY=your_clist_api_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

| Variable | Used By |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | All API calls (auth, problems, editor, chat, payments) |
| `NEXT_PUBLIC_CLIST_USERNAME` | `/events` — Clist.by API for contest calendar |
| `NEXT_PUBLIC_CLIST_API_KEY` | `/events` — Clist.by API key |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `/premium` — Razorpay checkout SDK |

---

## Local Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve production build
npm run lint    # ESLint
```

---

## Authentication

Auth state lives in Redux (`authSlice`). On app boot, `checkAuth` dispatches against `GET /api/auth/check` to rehydrate from the existing JWT cookie.

**`NavbarWrapper`** (in root `layout.tsx`) reads `isAuthenticated` from Redux and conditionally renders the global navbar. The guest landing page (`HomeWithoutLogin`) has its own marketing header and does not use the global navbar.

**Google OAuth flow:**
1. User clicks "Continue with Google" → frontend links to `GET /api/auth/google`
2. Passport handles the redirect and callback server-side
3. On success, backend issues the JWT cookie and redirects to `/`
4. `checkAuth` on the next render picks up the session

**Protected routes** check Redux auth state client-side. The admin panel (`/admin/*`) additionally checks `user.role === 'admin'` in its layout.

---

## Problem Workspace

The workspace at `/problems/[slug]/*` uses `react-resizable-panels` for a split-pane layout:
- **Left panel:** Problem statement, editorial, solutions, submissions, or AI chat (tab navigation)
- **Right panel:** Monaco editor + test case results

### Code Editor (`CodeEditorSection.tsx`)
- Monaco Editor with syntax highlighting for JS, Python, Java, C++, and C
- Starter code loaded from the problem's `startCode[]` array per language
- Language and theme changes are persisted to the backend (`POST /api/theme`)

### Draft Auto-Save
On every keystroke (debounced), code is saved to `POST /api/problems/:problemId/draft`. On workspace load, the latest draft is fetched and pre-fills the editor. Drafts are per problem + per language.

### Run vs Submit
- **Run** (`POST /api/run/:problemId`): executes against visible test cases only, fast feedback
- **Submit** (`POST /api/submit/:problemId`): runs against all test cases (visible + hidden), triggers 10-second cooldown
- Both flows handled by `useRunCode.ts`
- Accepted submission triggers confetti via `canvas-confetti`

### Timer
The workspace navbar includes a countdown/countup timer stored in local component state. Timer controls (start/pause/reset) visible in the `Navbar.tsx` component.

### AI Chat (`/problems/[slug]/chatai`)
Each problem has a chat tab powered by the backend Groq integration. Conversation history is maintained in component state per session. The chat refuses full solutions and provides structured hints if available on the problem.

---

## Contests

### Contest List (`/contests`)
Three tabs (Upcoming / Running / Past) fetched from `GET /api/user/contest`. Status is derived from `startTime`/`endTime`.

### Contest Detail (`/contests/[contestId]`)
- Summary card with schedule, participant count, and prize list
- Problems list — links to the contest workspace while running, or to `/problems/[slug]/description` after the contest ends
- Live leaderboard showing rank, score, and penalty

### Contest Problem Workspace
Mirrors the regular problem workspace but:
- Submissions go to `POST /api/user/contest/:contestId/submit/:problemId`
- A timer badge in the navbar shows "Starts in… / Time left… / Contest ended" based on contest schedule
- Editorial and solutions tabs are locked until `contest.status === 'ended'`

---

## Premium Flow

1. User visits `/premium` → sees monthly/yearly plan cards
2. Clicks "Buy" → frontend calls `POST /api/payments/create-order` → gets Razorpay order ID
3. Razorpay checkout SDK opens (key from `NEXT_PUBLIC_RAZORPAY_KEY_ID`)
4. On payment success → frontend calls `POST /api/payments/verify-payment` with signature
5. Backend verifies HMAC, updates user to premium, returns updated user
6. Redux store updates `user.subscriptionType` — premium gates lift immediately

For locked premium problems, the backend returns `{ action: 'upgrade_to_premium' }` and the frontend redirects to `/premium`.

---

## Points & Rewards

Users earn points for accepted submissions. The `/redeem` page shows a catalog of physical rewards. On redemption, an order is created with a delivery address. The `/my-orders` page shows order status with the full history pipeline (`pending → packed → shipped → out_for_delivery → delivered`).

---

## Styling Conventions

Tailwind CSS v4 is used throughout. For new components, use CSS variables directly rather than custom utility classes to avoid Tailwind name conflicts:

```css
var(--primary)          /* brand color */
var(--foreground)       /* main text */
var(--muted-foreground) /* secondary text */
var(--card)             /* card background */
var(--border)           /* border color */
var(--muted)            /* muted background */
var(--secondary)        /* secondary background */
var(--destructive)      /* error/danger */
```

Global animation keyframes (`float`, `fade-in-down`, `shake`, etc.) are defined once in `globals.css`.

---

## Key Routes

| Route | Description |
|---|---|
| `/` | Home (dashboard if logged in, landing page if not) |
| `/accounts/login` | Login |
| `/accounts/signup` | Signup |
| `/accounts/forgot-password` | Password reset |
| `/problems` | Problem listing with filters |
| `/problems/[slug]/description` | Problem workspace |
| `/problems/[slug]/editorial` | Editorial |
| `/problems/[slug]/solutions` | Reference solutions |
| `/problems/[slug]/submissions` | Submission history |
| `/problems/[slug]/chatai` | AI chat assistant |
| `/contests` | Contest list |
| `/contests/[contestId]` | Contest detail |
| `/contests/[contestId]/problem/[problemId]/description` | Contest problem workspace |
| `/:username` | Public user profile |
| `/premium` | Premium plans + checkout |
| `/events` | Coding events calendar |
| `/redeem` | Rewards catalog |
| `/my-orders` | Redemption order tracking |
| `/admin/problems` | Admin: problem management |
| `/admin/create-problem` | Admin: create problem |
| `/admin/contests` | Admin: contest management |
| `/admin/contests/[contestId]/edit` | Admin: edit contest |
| `/admin/redemptions` | Admin: manage redemption orders |
| `/admin/create-admins` | Admin: create admin accounts |
