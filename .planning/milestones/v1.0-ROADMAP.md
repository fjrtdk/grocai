# Roadmap: GrocAI

**Generated:** 2026-05-09
**Granularity:** Coarse (3 phases for 8 v1 requirements)
**Core Value:** Users can manage their grocery shopping from list creation to checkout, with AI handling categorization and product enrichment so they don't have to.

## Phases

- [ ] **Phase 1: Deploy Infrastructure** - Get the app live on Vercel with production URL and basic UX polish
- [x] **Phase 2: CI/CD + Testing Foundation** - Automated deployment pipeline with test infrastructure
- [ ] **Phase 3: AI Insights** - AI-powered shopping insights generated and persisted to Firestore

## Phase Details

### Phase 1: Deploy Infrastructure
**Goal**: App is live and usable at a production URL with basic UX safeguards
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: DEPLOY-01, DEPLOY-02, POLISH-01, POLISH-02, POLISH-03
**Success Criteria** (what must be TRUE):
  1. User can visit the production URL and the app loads successfully
  2. User can navigate to any route and refresh the page without getting a 404 error (SPA routing via vercel.json rewrites)
  3. Runtime errors show a friendly error boundary UI instead of a blank white screen
  4. All pages show loading spinners/skeletons while data is being fetched
  5. Lists and pantry pages display helpful empty state messages when they have no items
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Deploy to Vercel (DEPLOY-01, DEPLOY-02)
- [ ] 01-02-PLAN.md — Error boundary, loading states, empty states (POLISH-01, POLISH-02, POLISH-03)
**UI hint**: yes

### Phase 2: CI/CD + Testing Foundation
**Goal**: Automated pipeline deploys changes safely and test infrastructure is ready
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: DEPLOY-03, TEST-00
**Success Criteria** (what must be TRUE):
   1. Pushing to main branch triggers automatic Vercel deployment without manual intervention
   2. `npm test` runs Vitest tests successfully with Vite integration configured
   3. Test configuration supports running in CI environment (no interactive dependencies)
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — GitHub Actions CI/CD Pipeline (DEPLOY-03)
- [x] 02-02-PLAN.md — Vitest Test Infrastructure (TEST-00)

### Phase 3: AI Insights
**Goal**: AI-powered shopping insights are generated and persisted to Firestore
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: FEAT-01
**Success Criteria** (what must be TRUE):
  1. AI shopping insights appear on the dashboard for users to view
  2. Insight data is written and persisted to the Firestore `tips` collection
  3. Insights update when new list items are added or checked off (regenerative, not stale)
**Plans**: TBD
**UI hint**: yes

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPLOY-01 | Phase 1 | Pending |
| DEPLOY-02 | Phase 1 | Pending |
| POLISH-01 | Phase 1 | Pending |
| POLISH-02 | Phase 1 | Pending |
| POLISH-03 | Phase 1 | Pending |
| DEPLOY-03 | Phase 2 | Complete |
| TEST-00 | Phase 2 | Complete |
| FEAT-01 | Phase 3 | Pending |

**Coverage:** 8/8 v1 requirements mapped ✓

## Dependencies

```
Phase 1 (Deploy) ──> Phase 2 (CI/CD) ──> Phase 3 (AI Insights)
```

- Phase 1 must complete first (app must be live before automation or AI matters)
- Phase 2 must complete before Phase 3 (CI pipeline protects AI feature changes)

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Deploy Infrastructure | 0/2 | Not started | - |
| 2. CI/CD + Testing Foundation | 2/2 | Complete | 2026-05-10 |
| 3. AI Insights | 0/0 | Not started | - |

---

*Roadmap created: 2026-05-09*
