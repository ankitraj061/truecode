# TrueCode Frontend

Frontend for the TrueCode coding-practice platform, built with Next.js App Router, TypeScript, Redux Toolkit, and Tailwind CSS.

This README reflects the current frontend implementation, including the new contest system, admin tools, and updated UI.

## What Is Implemented

- Auth flow
  - Email/password login and signup
  - Google OAuth redirect flow
  - Global auth initialization (`checkAuth`) on app load
- Home experience
  - Different landing views for authenticated vs unauthenticated users
- Problems dashboard (`/problems`)
  - Filters: difficulty, status, type
  - Topic and company filters
  - Search, sort, pagination
  - Save/unsave problem support
  - Premium-aware filtering behavior
- Problem workspace (`/problems/[slug]/*`)
  - Split-pane layout (problem + editor/test area)
  - Monaco editor with multiple languages (JS, Python, Java, C++, C)
  - Run code with optional custom test cases
  - Submit flow and submission result overlay
  - Draft auto-save/load per problem-language
  - Timer controls in workspace navbar
  - Tabs: Description, Editorial, Solutions, Submissions, ChatAI
- Profile page (`/[username]`)
  - Header, problem stats, badges, heatmap, recent submissions
- Premium page (`/premium`)
  - Plan cards and Razorpay checkout integration
- Events page (`/events`)
  - Contest calendar/track view using Clist API credentials
- Redeem page (`/redeem`)
  - Rewards catalog UI (currently local client-side state)
- Contests system
  - Public contests list (`/contests`) with tabs: Upcoming, Running, Past
  - Contest detail page (`/contests/[contestId]`) with:
    - Summary card (title, description, schedule, participants, status)
    - How‑it‑works section (scoring, penalties, ranking rules)
    - Problems list that links to:
      - `/contests/[contestId]/problem/[problemId]/description` while running
      - `/problems/[slug]/description` after the contest ends
    - Live leaderboard (score, penalty, time)
  - Contest problem workspace (`/contests/[contestId]/problem/[problemId]/description`)
    - Mirrors regular problem layout: description, hints, examples, constraints
    - Contest‑aware editor + testcases panel and a contest submit route
    - Timer badge showing “Starts in… / Time left… / Contest ended”
    - Editorial/solutions only visible after contest ends
- Admin tools
  - Problems (`/admin/problems`)
    - Filtered list + 3‑dot actions: Edit, Make active/inactive, Delete
    - Dedicated create page (`/admin/create-problem`) that reuses the same `ProblemForm` as edit
  - Contests (`/admin/contests`)
    - List with status and participants, matching Problems table styling
    - 3‑dot actions: Edit (routes to `/admin/contests/[contestId]/edit`), Delete
    - Admin contest editor:
      - Update title/description/schedule/type/max participants
      - Add/remove problems (new problems must still be inactive; existing contest problems may now be active after contest end)
- Home experience
  - Logged‑out home (`HomeWithoutLogin`):
    - Flickering grid hero, feature sections, rewards, premium, progress, and CTA
    - New “See How It Works” button that opens a shared showcase modal
  - Logged‑in home (`Home`):
    - Personalized hero with AI‑style code editor card
    - “How TrueCode Works” button that opens the same showcase modal

## Tech Stack

- Next.js `15`
- React `19`
- TypeScript
- Redux Toolkit + React Redux
- Tailwind CSS `v4`
- Monaco Editor (`@monaco-editor/react`)
- Framer Motion
- Axios

## Key Routes

- `/` - home
- `/accounts/login` - login
- `/accounts/signup` - signup
- `/problems` - problem listing
- `/problems/[slug]/description` - description + discussion
- `/problems/[slug]/editorial` - editorial content
- `/problems/[slug]/solutions` - reference solutions
- `/problems/[slug]/submissions` - submission history
- `/problems/[slug]/chatai` - problem chat assistant
- `/:username` - user profile
- `/premium` - premium plans
- `/events` - coding events calendar
- `/redeem` - rewards redeem page
- `/contests` - contests list (Upcoming / Running / Past)
- `/contests/[contestId]` - contest detail (summary, how‑it‑works, problems, leaderboard)
- `/contests/[contestId]/problem/[problemId]/description` - contest problem view
- `/admin/problems` - admin problems list
- `/admin/create-problem` - admin create problem
- `/admin/contests` - admin contests list
- `/admin/contests/[contestId]/edit` - admin edit contest

## Environment Variables

Create a `.env` file in project root:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_CLIST_USERNAME=your_clist_username
NEXT_PUBLIC_CLIST_API_KEY=your_clist_api_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
```

Notes:
- `NEXT_PUBLIC_BACKEND_URL` is required for auth, problems, profile, editor run/submit, chat, and premium APIs.
- `NEXT_PUBLIC_CLIST_USERNAME` and `NEXT_PUBLIC_CLIST_API_KEY` are used by `/events`.
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is used as fallback for Razorpay checkout.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev    # start dev server
npm run build  # production build
npm run start  # run production build
npm run lint   # run eslint
```

## Backend Dependency

This frontend expects a compatible TrueCode backend API with cookie-based auth and endpoints such as:

- `/api/auth/*`
- `/api/user/problem/*`
- `/api/run/:problemId`
- `/api/problems/:problemId/draft`
- `/api/payments/*`

If backend APIs are unavailable, several pages will render error/empty states.
