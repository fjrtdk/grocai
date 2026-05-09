# Requirements: GrocAI

**Defined:** 2026-05-09
**Core Value:** Users can manage their grocery shopping from list creation to checkout, with AI handling categorization and product enrichment so they don't have to.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Deploy

- [ ] **DEPLOY-01**: App is deployable to Vercel with a single command
- [ ] **DEPLOY-02**: SPA routing works on page refresh (vercel.json rewrites)
- [ ] **DEPLOY-03**: Auto-deploy to Vercel on push to main branch

### Testing Infrastructure

- [ ] **TEST-00**: Vitest installed and configured with Vite integration

### Polish

- [ ] **POLISH-01**: App has a React error boundary catching runtime errors
- [ ] **POLISH-02**: All pages show loading states while data is fetching
- [ ] **POLISH-03**: Empty states shown when lists/pantry have no items

### Missing Features

- [ ] **FEAT-01**: AI insights generate and persist to Firestore (tips collection is written)

## v2 Requirements

Deferred to future release.

### Testing

- **TEST-01**: Unit tests for AI API wrapper (src/lib/ai.ts)
- **TEST-02**: Unit tests for barcode lookup (src/lib/barcode.ts)
- **TEST-03**: Unit tests for utility functions (src/lib/utils.ts)
- **TEST-04**: Component tests for UI primitives
- **TEST-05**: Hook tests for domain hooks

### Polish

- **POLISH-04**: Remove English locale, Danish-only
- **POLISH-05**: Remove unused dependencies (Zustand, unused Radix)
- **POLISH-06**: Move openai SDK to dependencies from devDependencies
- **POLISH-07**: Fix window.prompt for list creation
- **POLISH-08**: Add 404 catch-all route
- **POLISH-09**: Fix `list: any` type in ListsHome

### Missing Features

- **FEAT-02**: Wire up activity log subcollection
- **FEAT-03**: Add lazy loading / code splitting for pages

### CI/CD

- **CI-01**: GitHub Actions workflow for lint + test + build
- **CI-02**: Error monitoring (Sentry)

### Infrastructure

- **INFRA-01**: Firebase project configuration documented
- **INFRA-02**: NVIDIA NIM API key documented
- **INFRA-03**: Firebase App Check (reCAPTCHA)
- **INFRA-04**: NVIDIA API key proxy (Vercel Function)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auth migration away from Firebase | Staying with Firebase Auth for v1 |
| Native mobile app | PWA sufficient for personal use |
| Push notifications | Low priority for personal use, defer |
| Backend server / Cloud Functions | Staying serverless |
| English locale | Dropping for Danish-only focus |
| Recipe import / meal planning | Requires significant new infrastructure |
| Spending analytics / price tracking | Defer to v2+ |
| Full test suite before deploy | Critical path tests are v2; deploy first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPLOY-01 | Phase 1 | Pending |
| DEPLOY-02 | Phase 1 | Pending |
| DEPLOY-03 | Phase 2 | Pending |
| TEST-00 | Phase 2 | Pending |
| POLISH-01 | Phase 1 | Pending |
| POLISH-02 | Phase 1 | Pending |
| POLISH-03 | Phase 1 | Pending |
| FEAT-01 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-09*
*Last updated: 2026-05-09 after initial definition*
