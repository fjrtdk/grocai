# Phase 1: Deploy Infrastructure - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy the app to Vercel with a production URL and basic UX safeguards. Covers Vercel project setup, SPA routing configuration (vercel.json rewrites), React error boundary, loading states, and empty states across all pages.

**Requirements:** DEPLOY-01, DEPLOY-02, POLISH-01, POLISH-02, POLISH-03
**Success criteria defined in ROADMAP.md** — see `.planning/ROADMAP.md` §Phase 1.

</domain>

<decisions>
## Implementation Decisions

### Vercel Setup
- **D-01:** Project created via Vercel CLI (`vercel link`) rather than dashboard
- **D-02:** Project name `grocai` — production URL will be `grocai.vercel.app`
- **D-03:** Connect GitHub during initial setup for auto-deploy on push (not deferred to Phase 2)
- **D-04:** Environment variables configured via `vercel env add` (one per var, CLI-based)
- **D-05:** Pre-deploy gate: `tsc --noEmit && eslint . && vite build` (typecheck + lint + build)

### Error Boundary (POLISH-01)
- **D-06:** Per-page error boundaries via a single shared `ErrorBoundary` component inside `<AppShell>` with route-based `key` for reset on navigation
- **D-07:** Fallback UI branded with dark theme — icon + "Noget gik galt" message + "Prøv igen" retry button
- **D-08:** No toast-based error handler for recoverable errors — error boundary only

### Loading States (POLISH-02)
- **D-09:** Skeleton placeholders (not spinners) with pulse animation
- **D-10:** Per-component skeletons (not full-page) — each data-driven section loads independently
- **D-11:** Per-page custom skeleton markup (not a shared `Skeleton` component)

### Empty States (POLISH-03)
- **D-12:** Text message + Lucide icon illustration
- **D-13:** Each empty state includes a call-to-action button for the primary next action
- **D-14:** Per-page custom empty states (not a shared component)
- **D-15:** Affected pages: ListsHome ("Ingen lister endnu"), ListDetail (all items checked off), Pantry, Dashboard (no pinned lists)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` §Phase 1 — Success criteria, goal, requirements mapped
- `.planning/REQUIREMENTS.md` — DEPLOY-01, DEPLOY-02, POLISH-01, POLISH-02, POLISH-03 definitions
- `.planning/PROJECT.md` — Project-level decisions (deploy first, Firebase Auth, Danish-only)

### Codebase Maps
- `.planning/codebase/STACK.md` — Vite build, React 19, Tailwind v4, PWA config
- `.planning/codebase/ARCHITECTURE.md` — SPA routing (6 routes), AppShell, auth gate pattern
- `.planning/codebase/INTEGRATIONS.md` — Firebase env vars needed, NVIDIA NIM API key

### Environment
- `.env.example` — Required environment variables for Vercel
- `firestore.rules` — Firestore security rules (not changing, but verify compatibility)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/` — 7 UI primitives (Button, Card, Input, Badge, Checkbox, Dialog, Sheet, Avatar) — use for error boundary fallback UI and empty state CTAs
- `src/lib/utils.ts` — `cn()` class merge utility — use for conditional styling in new components
- `src/hooks/useFirestore.ts` — `useCollection`, `useDocument` — hooks already have loading state handling patterns to extend
- `src/App.tsx` — Auth gate with loading pattern (spinner while auth loads) — reference for loading state placement
- `src/components/layout/AppShell.tsx` — Shared layout wrapper — insertion point for shared ErrorBoundary and route-keyed reset
- Lucide React icons available — use for empty state illustrations

### Established Patterns
- Feature-based grouping: pages own their data-fetching via custom hooks — loading/empty states should live at the page level
- Dark theme with Tailwind v4 OKLCH tokens (`--color-background: oklch(0 0 0)`)
- All logic client-side, no SSR — Vercel deployment is a static SPA with `vercel.json` rewrites

### Integration Points
- `vite.config.ts` — Build pipeline (tsc + vite build), PWA plugin config
- `src/App.tsx:12-36` — Auth gate + `BrowserRouter` — place error boundary wrapping `<Routes>` or inside `<AppShell>`
- `.env.example` — 7 env vars (Firebase + NVIDIA) to configure in Vercel
- `index.html` — Entry point, PWA manifest link

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow existing UI component conventions and dark theme styling.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Deploy Infrastructure*
*Context gathered: 2026-05-09*
