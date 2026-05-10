# GrocAI

## What This Is

GrocAI is a Danish-first AI-powered grocery shopping PWA. Users create shared shopping lists with AI-powered categorization, scan barcodes for product info, manage their pantry with expiry tracking, and get smart shopping insights on their dashboard. Ships via CI/CD with test infrastructure.

Built for personal use — the user and their family.

**Current state:** v1.0 MVP shipped (all 8 requirements complete). Live at grocai-five.vercel.app.

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
- ✓ Vercel deployment with production URL — v1.0
- ✓ SPA routing with vercel.json rewrites — v1.0
- ✓ React error boundary with route-keyed reset — v1.0
- ✓ Skeleton loading states on all pages — v1.0
- ✓ Empty states on all list/pantry pages — v1.0
- ✓ CI/CD pipeline (GitHub Actions: lint → test → build → deploy) — v1.0
- ✓ Vitest + happy-dom test infrastructure (3 smoke tests) — v1.0
- ✓ AI insights persisted to Firestore tips collection — v1.0

### Active



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

v1.0 MVP shipped. The app is live at grocai-five.vercel.app with CI/CD pipeline (GitHub Actions: lint → test → build → deploy), Vitest test infrastructure (3 passing smoke tests), and AI insights persisted to Firestore.

Built with React 19 + TypeScript + Vite + Tailwind v4. Firebase (Auth + Firestore) provides the backend. NVIDIA NIM API handles AI categorization, enrichment, and insight generation. Barcode lookups hit PriceTracker.dk, OpenFoodFacts, and OpenProductsFacts in parallel.

### Known Technical Debt

- No unit tests for AI API wrapper, barcode lookup, or utility functions
- No component tests for UI primitives or hooks
- No code splitting / lazy loading
- English locale still bundled
- Unused dependencies (Zustand, some Radix packages)
- `window.prompt` used for list creation
- Activity log subcollection not wired up
- No 404 catch-all route

### Deployment Target

Vercel (production: grocai-five.vercel.app). Static SPA with environment variables for Firebase and NVIDIA API.

## Constraints

- **Timeline**: Deploy this week (priority 1)
- **Tech stack**: React 19 + Vite + Firebase + NVIDIA NIM (no backend server)
- **Auth**: Firebase Auth with Google Sign-In only
- **Language**: Danish-only (da-DK) for v1
- **Audience**: Personal use (user + family)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Deploy first | Get live ASAP before deep polish | ✅ Done — v1.0 live at grocai-five.vercel.app |
| Keep Firebase Auth | Already integrated, working, simple for personal use | ✅ Works with signInWithRedirect |
| Danish-only | Primary audience is Danish speaker | ⚠️ English locale still bundled — tech debt |
| Personal PWA | No app store submission needed, sufficient for family use | ✅ Live as PWA |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with v1.0 tag
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-10 after v1.0 milestone*
