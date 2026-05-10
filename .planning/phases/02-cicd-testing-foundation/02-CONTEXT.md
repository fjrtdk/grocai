# Phase 2: CI/CD + Testing Foundation - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up CI/CD pipeline with GitHub Actions that gates Vercel deploys behind lint + test + build checks, and install and configure Vitest with a smoke test to validate the setup.

**Requirements:** DEPLOY-03, TEST-00
**Success criteria defined in ROADMAP.md** — see `.planning/ROADMAP.md` §Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Auto-deploy Approach
- **D-01:** GitHub Actions workflow gates Vercel deploy — run lint → test → build sequentially, then deploy only if all pass
- **D-02:** Vercel's native git integration is replaced by GH Actions-controlled deploy for safety (tests before deploy)

### Test Setup
- **D-03:** Install Vitest + `@testing-library/react` + `happy-dom`
- **D-04:** Write 1-2 smoke tests to validate the setup works (e.g., a utility function test and a component render test)
- **D-05:** No coverage thresholds this phase — just setup + smoke test

### CI Workflow Design
- **D-06:** Single workflow file (`.github/workflows/ci.yml`)
- **D-07:** Sequential jobs: lint → test → build → deploy
- **D-08:** Trigger on all pushes + pull requests to `main` branch
- **D-09:** Node 20, with dependency caching
- **D-10:** Vercel deploy job only runs on push to `main` (not PRs)

### Test Environment
- **D-11:** Use `happy-dom` (not jsdom) for DOM environment in component tests

### Pre-commit Hooks
- **D-12:** No local hooks (husky/lint-staged). All checks run in CI only.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` §Phase 2 — Success criteria, goal, requirements mapped
- `.planning/REQUIREMENTS.md` — DEPLOY-03, TEST-00 definitions
- `.planning/PROJECT.md` — Project-level decisions (Vercel, Firebase Auth, Danish-only)

### Codebase Maps
- `.planning/codebase/STACK.md` — Vite build, React 19, Tailwind v4, PWA config
- `.planning/codebase/TESTING.md` — Current test gaps, suggested test layers, dependencies needed
- `.planning/codebase/ARCHITECTURE.md` — SPA routing, feature-based grouping, auth gate pattern
- `.planning/codebase/INTEGRATIONS.md` — Firebase env vars, NVIDIA NIM API key

### Phase 1 Context
- `.planning/phases/01-deploy-infrastructure/01-CONTEXT.md` — D-03: GitHub already connected to Vercel

### Config
- `.env.example` — Required environment variables for Vercel
- `package.json` — Current dev scripts (build, lint, preview)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vite.config.ts` — Build pipeline config — Vitest extends this config
- `eslint.config.js` — Flat ESLint 10 config — reuse for lint job in CI
- `src/lib/utils.ts` — Pure functions (`cn()`), easy first smoke test candidate
- `src/App.tsx` — Simple component, candidate for render smoke test

### Established Patterns
- Pre-deploy gate already runs `tsc --noEmit && eslint . && vite build` (from `package.json` `predeploy` script)
- No test infrastructure exists — zero dependencies, zero test files
- Project uses npm (not yarn/pnpm) — relevant for CI caching

### Integration Points
- `.github/workflows/ci.yml` — New file, does not exist yet
- `vite.config.ts` — Add `test` section for Vitest + happy-dom config
- `package.json` — Add `test` script, add Vitest + testing-library + happy-dom dev dependencies

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow existing Vite + React project conventions for Vitest setup.

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
The v2 requirements from REQUIREMENTS.md list CI-01 (GitHub Actions for lint + test + build) — this is being handled in Phase 2 scope, not deferred. The more granular test requirements (TEST-01 through TEST-05) remain v2 and are not in scope.

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-CI/CD + Testing Foundation*
*Context gathered: 2026-05-10*
