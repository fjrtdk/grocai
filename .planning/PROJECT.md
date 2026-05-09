# GrocAI

## What This Is

GrocAI is a Danish-first grocery shopping app with AI-powered features. Users create shared shopping lists, scan barcodes for product info and prices, manage their pantry with expiry tracking, and get smart shopping insights. Runs entirely in the browser as a PWA with Firebase backend.

Built for personal use — the user and their family.

## Core Value

Users can manage their grocery shopping from list creation to checkout, with AI handling categorization and product enrichment so they don't have to.

## Requirements

### Validated

- ✓ Google Sign-In authentication — existing
- ✓ Grocery list CRUD with member-based sharing (owner/editor/viewer) — existing
- ✓ List items with AI-powered categorization (category + storage area) — existing
- ✓ Barcode scanning via camera (react-zxing) — existing
- ✓ Barcode product lookup (PriceTracker.dk, OpenFoodFacts, OpenProductsFacts) — existing
- ✓ AI product enrichment via NVIDIA NIM (49B model) — existing
- ✓ Pantry management with expiry tracking — existing
- ✓ Real-time sync via Firestore onSnapshot — existing
- ✓ PWA support (offline, installable) — existing
- ✓ Internationalization framework (i18next, Danish + English) — existing
- ✓ AI shopping insights generation — existing
- ✓ Dashboard with pinned list preview — existing
- ✓ Settings page (locale, sign-out) — existing
- ✓ Dark theme UI with Tailwind v4 — existing
- ✓ Firestore security rules with member-based access — existing
- ✓ Danish as default locale — existing

### Active

- [ ] **DEPLOY-01**: Deploy to Vercel with production URL
- [ ] **DEPLOY-02**: Firebase project configuration (auth, Firestore, env vars)
- [ ] **DEPLOY-03**: NVIDIA NIM API key configured
- [ ] **DEPLOY-04**: Production build pipeline working (tsc + vite build)
- [ ] **TEST-01**: Unit tests for AI API wrapper (src/lib/ai.ts)
- [ ] **TEST-02**: Unit tests for barcode lookup (src/lib/barcode.ts)
- [ ] **TEST-03**: Unit tests for utility functions (src/lib/utils.ts)
- [ ] **TEST-04**: Component tests for UI primitives
- [ ] **TEST-05**: Hook tests for domain hooks
- [ ] **CI-01**: GitHub Actions for automated lint + test + build
- [ ] **CI-02**: Automated Vercel deploy on push
- [ ] **POLISH-01**: Remove English locale, Danish-only
- [ ] **POLISH-02**: Remove unused dependencies (Zustand, unused Radix, move openai to dependencies)
- [ ] **POLISH-03**: Add error boundary and error logging
- [ ] **POLISH-04**: Fix window.prompt for list creation
- [ ] **POLISH-05**: Add 404 catch-all route
- [ ] **POLISH-06**: Fix `list: any` type in ListsHome
- [ ] **POLISH-07**: Add loading/empty/error states across pages
- [ ] **FEAT-01**: Wire up activity log subcollection
- [ ] **FEAT-02**: Wire up AI insight generation (tips collection is never written)
- [ ] **FEAT-03**: Add lazy loading / code splitting for pages

### Out of Scope

| Feature | Reason |
|---------|--------|
| Auth migration (Next-Auth, etc.) | Staying with Firebase Auth for v1 |
| Native mobile app | PWA sufficient for personal use |
| Push notifications | Low priority for personal use, defer |
| Backend server / Cloud Functions | Staying serverless |
| Multi-user real-time collaboration | Beyond current needs |
| English locale | Dropping for Danish-only focus |

## Context

### Codebase State

The app is fully coded with React 19 + TypeScript + Vite + Tailwind v4. Firebase (Auth + Firestore) provides the backend. NVIDIA NIM API handles AI categorization and enrichment. Barcode lookups hit PriceTracker.dk, OpenFoodFacts, and OpenProductsFacts in parallel.

The codebase has a thorough codebase map with architecture, stack, structure, conventions, concerns, integrations, and testing docs in `.planning/codebase/`.

### Current Gaps

- No test infrastructure (zero tests)
- No CI/CD pipeline
- No deployment configuration
- Firebase not connected (env vars missing)
- Technical debt: unused deps, silent errors, missing features from SPEC
- AI insights and activity log features defined but not wired up

### Deployment Target

Vercel (account needs setup). Static SPA with environment variables for Firebase and NVIDIA API.

## Constraints

- **Timeline**: Deploy this week (priority 1)
- **Tech stack**: React 19 + Vite + Firebase + NVIDIA NIM (no backend server)
- **Auth**: Firebase Auth with Google Sign-In only
- **Language**: Danish-only (da-DK) for v1
- **Audience**: Personal use (user + family)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Deploy first | Get live ASAP before deep polish | — Pending |
| Keep Firebase Auth | Already integrated, working, simple for personal use | — Pending |
| Danish-only | Primary audience is Danish speaker | — Pending |
| Personal PWA | No app store submission needed, sufficient for family use | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-09 after initialization*
