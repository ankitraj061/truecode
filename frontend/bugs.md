# TrueCode Frontend — Bug Report

Scanned files: app routes, components, slices, hooks, and API utilities.
Last updated: 2026-05-10

---

## Open Issues

### BUG-F10 · **MEDIUM** — Admin layout can show non-actionable "Checking admin access..."
**File:** `src/app/admin/layout.tsx` · Lines **66–74**

State has no retry/login CTA and can be confusing under auth-check/network edge cases.

---

### BUG-F18 · **HIGH** — CLIST API key is exposed client-side
**File:** `src/app/events/page.tsx` · Lines **35–36**, **97**

`NEXT_PUBLIC_CLIST_API_KEY` is used in browser requests; this key is publicly visible.

**Recommended fix:** move CLIST fetch to a backend/server route and read key from server-only env.
