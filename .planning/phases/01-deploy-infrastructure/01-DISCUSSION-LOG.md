# Phase 1: Deploy Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 1-Deploy Infrastructure
**Areas discussed:** Vercel setup approach, Empty states treatment, Error boundary layout, Loading states design, Build verification

---

## Vercel Setup Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel CLI | Use `vercel link` from the project directory — fast, scriptable, no dashboard needed | ✓ |
| GitHub import | Connect repo on Vercel dashboard — auto-deploys on push from the start | |
| Web dashboard | Create project manually via vercel.com dashboard, configure step by step | |

**User's choice:** Vercel CLI
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| grocai | Project name: grocai → URL: grocai.vercel.app (short, matches brand) | ✓ |
| grocai-app | Project name: grocai-app → URL: grocai-app.vercel.app (more descriptive) | |
| custom domain | Skip default URL — I'll set up a custom domain later | |

**User's choice:** grocai
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| CLI first, GitHub later | `vercel --prod` for initial deploy, GitHub integration added in Phase 2 | |
| Connect GitHub now | Set up GitHub integration during initial setup so pushes auto-deploy immediately | ✓ |

**User's choice:** Connect GitHub now
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| CLI env add | Use `vercel env add` for each var — scriptable, repeatable, works in CI | ✓ |
| Dashboard | Add env vars manually in Vercel dashboard — visual, easier for one-time setup | |
| .env + vercel.json | Use vercel.json env field or .env file — keeps config in code | |

**User's choice:** CLI env add
**Notes:** None

---

## Empty States Treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Text-only | Simple message like "Ingen lister endnu" — minimal, fast, no illustration work | |
| Text + illustration | Message with a subtle illustration/icon above — more inviting, needs icon assets | ✓ |

**User's choice:** Text + illustration
**Notes:** Uses existing Lucide React icons

---

| Option | Description | Selected |
|--------|-------------|----------|
| With CTA | Button to take the primary next action | ✓ |
| No CTA | Just the message and illustration | |

**User's choice:** With CTA
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reusable component | One `<EmptyState icon={...} />` with props for icon, message, CTA | |
| Per-page custom | Each page implements its own | ✓ |

**User's choice:** Per-page custom
**Notes:** User chose per-page despite recommendation for reusable

---

| Option | Description | Selected |
|--------|-------------|----------|
| All relevant pages | ListsHome, ListDetail, Pantry, Dashboard | ✓ |
| Only lists + pantry | Just the two main empty states as scoped in POLISH-03 | |

**User's choice:** All relevant pages
**Notes:** ListsHome, ListDetail (all items checked), Pantry, Dashboard (no pinned lists)

---

## Error Boundary Layout

| Option | Description | Selected |
|--------|-------------|----------|
| One global boundary | Catches all uncaught errors — simple, one place | |
| Per-page boundaries | Each page has its own — if one crashes, others still work | ✓ |

**User's choice:** Per-page boundaries
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Branded with retry | "Noget gik galt" + "Prøv igen" — consistent with dark theme | ✓ |
| Minimal with nav | Simple message with link back to dashboard | |

**User's choice:** Branded with retry
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, both | Error boundary for crashes + toast for recoverable errors | |
| Error boundary only | Keep it simple | ✓ |

**User's choice:** Error boundary only
**Notes:** No toast handler for recoverable errors

---

| Option | Description | Selected |
|--------|-------------|----------|
| Wrapper per route | Each `<Route>` wrapped with `<ErrorBoundary>` — explicit | |
| Shared with reset key | One ErrorBoundary inside AppShell with key tied to route | ✓ |

**User's choice:** Shared with reset key
**Notes:** Fewer wrappers, resets on navigation

---

## Loading States Design

| Option | Description | Selected |
|--------|-------------|----------|
| Skeletons | Shapes matching page content layout — feels faster | ✓ |
| Spinners | Simple spinning icon | |

**User's choice:** Skeletons
**Notes:** Pulse animation

---

| Option | Description | Selected |
|--------|-------------|----------|
| Per-component | Individual skeleton for each data-driven section | ✓ |
| Full-page | One skeleton covering the entire page | |

**User's choice:** Per-component
**Notes:** Partial loads show real content where ready

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reusable Skeleton component | One `<Skeleton className='...'>` base | |
| Per-page custom skeletons | Each page builds its own loading markup | ✓ |

**User's choice:** Per-page custom skeletons
**Notes:** User chose per-page despite recommendation for reusable

---

| Option | Description | Selected |
|--------|-------------|----------|
| Pulse animation | Gentle opacity pulse — feels alive | ✓ |
| Static | No animation — less distracting | |

**User's choice:** Pulse animation
**Notes:** None

---

## Build Verification

| Option | Description | Selected |
|--------|-------------|----------|
| tsc + vite build | TypeScript check then Vite build | |
| tsc + lint + build | Add ESLint check before build | ✓ |
| Full suite | tsc + lint + build + tests | |

**User's choice:** tsc + lint + build
**Notes:** ESLint catches code quality issues

---

## the agent's Discretion

None — all decisions discussed and user-selected.

## Deferred Ideas

None — discussion stayed within phase scope.
