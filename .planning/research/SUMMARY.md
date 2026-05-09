# Project Research Summary

**Project:** GrocAI
**Domain:** Danish-first AI-powered grocery shopping PWA
**Researched:** 2026-05-09
**Overall Confidence:** HIGH

## Executive Summary

GrocAI is a fully-coded but undeployed Danish grocery shopping PWA with Firebase backend and NVIDIA NIM AI. The core experience is solid — shared lists with real-time sync, barcode scanning, pantry management with expiry tracking, and AI-powered product categorization/enrichment. What's missing is deployment infrastructure, test coverage, CI/CD, and wiring of two promised features (AI insights, activity log). The app is one deploy + one week of polish away from being genuinely useful to the user and their family.

**The recommended approach is "ship now, polish next."** Research across all four dimensions converges on the same priority: get the app live on Vercel with Firebase configured, then wire up the broken features and add quality gates. The app already ships 10/15 table-stakes features and has two genuine differentiators (AI categorization, AI enrichment) that competitors don't have. Deploying unblocks real-world use, which should drive feature priorities rather than speculation. Recipe import, meal planning, and spending analytics are deferred — they require significant new infrastructure and should grow from a working base.

**Key risks and mitigations:** (1) NVIDIA NIM API key is exposed in the client bundle — acceptable for personal use but requires a proxy before sharing with others. (2) Firestore security rules use `get()` on every subcollection read, doubling read costs — negligible at family scale but worth noting. (3) `signInWithRedirect` is broken on Safari/Firefox — switch to `signInWithPopup` before the first deploy. (4) SPA will 404 on page refresh without Vercel rewrites — must be in `vercel.json` before deploy. (5) AI insights and activity log are designed but never write to Firestore — wiring them is P0 because "AI" is in the product name.

## Key Findings

### Recommended Stack

The stack is a well-established Vite + React + Firebase SPA pattern with NVIDIA NIM for AI. No exotic or risky choices. The deployment architecture (Vercel static hosting, Firebase for backend, Sentry for monitoring) is the standard approach for this stack in 2026.

**Core technologies:**
- **Vercel**: Static SPA hosting with zero-config Vite detection, auto HTTPS via Let's Encrypt, global CDN, git-integrated CI/CD — the standard choice for React SPAs in 2026
- **Firebase Auth + Firestore**: Google-managed authentication and real-time document database; `onSnapshot` provides <1s sync that matches or beats dedicated list apps
- **NVIDIA NIM (via OpenAI SDK)**: AI categorization and product enrichment using a 49B parameter model; browser-direct calls via `dangerouslyAllowBrowser: true` (security tradeoff documented)
- **Vite 8 + React 19 + TypeScript 6.0**: Current-generation frontend toolchain; Vite 8 uses Rolldown (Rust-based) for faster builds
- **Tailwind CSS v4**: Utility-first CSS with the new CSS-first configuration
- **Sentry (free tier)**: Error monitoring with React 19 `createRoot` error handler support and session replays; 5K free errors/month
- **vite-plugin-pwa + Workbox**: PWA with auto-update, NetworkFirst caching for Firestore/Google APIs
- **Vitest 4 + Testing Library + MSW**: Testing Trophy approach with Vitest's native Vite integration for CI/CD quality gates

**One critical note on security:** The NVIDIA NIM API key is bundled into client-side JavaScript. For a personal/family app this is acceptable (limited threat surface, NVIDIA rate limiting provides some protection). A Vercel Edge Function or Cloud Function proxy is recommended before expanding beyond personal use. See PITFALLS.md for details.

### Expected Features

The grocery list app market is bifurcated between list-first apps (OurGroceries, AnyList) and inventory-first apps (Out of Milk, iofill). GrocAI already covers both categories better than most — the "existential threat" is that core features are coded but not deployed, and two key features (AI insights, activity log) are designed but never wired to Firestore writes.

**Must have (table stakes) — 10/15 shipped fully:**
- Shared lists with real-time sync (Firestore `onSnapshot`, <1s)
- Multiple lists per user with CRUD + archive
- Category/aisle organization (AI-powered, 16 Danish categories)
- Fast item entry (AddItemSheet, AI auto-categorizes on add)
- Barcode scanning (react-zxing, 3 parallel lookup APIs)
- Offline support (Firestore persistence cache + PWA service worker)
- Pantry/inventory tracking with expiry dates
- Member roles (owner/editor/viewer)
- Cross-platform (PWA works on phone + desktop)
- Checked items tracking (who checked what, when)

**Should have (competitive) — 2 shipped, 1 not wired:**
- AI-powered categorization ✅ Existing — genuine differentiator, most apps use manual/rules-based
- AI product enrichment ✅ Existing — barcode scan → AI fetches product info, images, prices
- AI shopping insights ⚠️ Defined but NOT WIRED — tips collection exists, writes never fire. This is GrocAI's headline feature and must be fixed before calling the app complete.
- Item autocomplete from purchase history ❌ Not verified — needs purchase history query
- Price estimates / running total in list view ❌ Data model supports it, UI may not

**Must fix before deploy (from FEATURES.md MVP recommendation):**
1. Wire AI insights (FEAT-02) — core value prop
2. Wire activity log (FEAT-01) — expected in shared lists
3. Add loading/empty/error states (POLISH-07) — first impression matters
4. Add error boundary (POLISH-03) — blank screen = unacceptable
5. Add 404 catch-all route (POLISH-05) — broken navigation

**Defer (v1.1+):**
- Recipe import / meal planning — requires new UI pipeline, 1-4 weeks
- Spending analytics — needs trip aggregation concept, 1-2 weeks
- Fridge photo scan / receipt OCR — vision API integration, hardware-dependent
- Natural language / voice input — nice-to-have
- Price comparison / deal matching — requires Danish store API integration, may not be feasible

**Anti-features (explicitly avoid):**
- No subscription for basic lists (fatigue is #1 complaint in app store reviews)
- No ads (grocery apps with ads feel cheap mid-shop)
- No social features (lists, not social networks)
- No OCR receipt scanning early on (wrong 20% of time = lost trust)
- No gamification (shopping is a chore, not a game)

### Architecture Approach

The architecture follows a standard SPA pattern: Vite builds a static bundle served by Vercel's CDN, with Firebase (Auth + Firestore) as the BaaS layer and NVIDIA NIM accessed directly from the browser. The testing architecture uses a Testing Trophy approach — heavy on integration tests (hooks + Firestore interaction), moderate on unit tests (pure functions, API wrappers), and light on UI-only unit tests. CI/CD follows a progressive quality gate: lint → typecheck → test → build → deploy via GitHub Actions with the Vercel CLI `build --prebuilt` pattern.

**Major architecture decisions:**

| Decision | Choice | Why |
|----------|--------|-----|
| Hosting | Vercel (static SPA) | Zero-config Vite, auto HTTPS, git-integrated CI/CD |
| Backend | Firebase Auth + Firestore only | No server needed; existing code already integrated |
| AI backend | NVIDIA NIM (browser-direct) | No proxy for v1; acceptable risk for personal use |
| Test runner | Vitest 4 + jsdom | Native Vite integration, React Testing Library compatible |
| HTTP mocking | MSW v2 | Vitest-recommended, intercepts at network layer |
| CI/CD | GitHub Actions → Vercel | Pre-deploy quality gates, deterministic builds |
| Firestore testing | Module mock (unit) + Emulator (integration) | Speed for unit, fidelity for integration |

**Key architectural gaps to address:**
- No test infrastructure at all (zero tests) — must be built from scratch
- No CI/CD pipeline — deploy is manual today
- Silent `catch {}` blocks swallow errors (AddItemSheet.tsx:59) — error logging needed
- `onSnapshot` listeners may not clean up on unmount — potential memory leaks and phantom reads
- Firestore queries lack `limit()` — safe at current scale but will need pagination
- PWA offline strategy exists but no UI distinction between "offline with data" vs "offline with nothing"

### Critical Pitfalls

**Top 5 pitfalls that must be addressed before or during initial deploy:**

1. **NVIDIA API Key in Client Bundle (CRITICAL)** — The `VITE_NVIDIA_API_KEY` is bundled into client JS at build time. Anyone with DevTools can extract it. **Mitigation:** Accept for personal use (limited threat surface). Add a Vercel Edge Function proxy before sharing with others. At minimum, add a build-time grep check for `nvapi-` in dist output.

2. **`signInWithRedirect` Broken on Safari/Firefox (CRITICAL)** — Third-party cookie blocking causes silent auth failure on ~20-30% of browsers. **Mitigation:** Switch to `signInWithPopup()` before deploying. No code change beyond the auth call — same UX, works everywhere.

3. **SPA 404 on Page Refresh (CRITICAL)** — Navigating to `/lists/abc123` and refreshing returns a 404 because Vercel doesn't know to serve `index.html` for client-side routes. **Mitigation:** Add `vercel.json` rewrites (`/(.*)` → `/index.html`) before first deploy. Also add React Router catch-all route with a 404 page.

4. **VITE_ Prefix Misconfiguration → Silent `undefined` (CRITICAL)** — Non-VITE_ env vars are `undefined` in client bundles. Current `.env.example` has `NVIDIA_API_KEY` instead of `VITE_NVIDIA_API_KEY`. **Mitigation:** Add build-time env validation in `src/lib/env.ts`, fix the naming mismatch, set all vars in Vercel dashboard.

5. **`onSnapshot` Listener Memory Leaks (CRITICAL)** — Listeners that aren't unsubscribed on unmount cause phantom reads, memory leaks, and stale data. **Mitigation:** Every `onSnapshot` in `useEffect` must return its unsubscribe function. Add tests that verify cleanup on unmount. Consider deduplicating listeners at the app level.

**One non-critical but surprising insight:** Firestore security rules use `get()` to check list membership on every subcollection read. Each `get()` is a billed read. Loading 100 items costs 200 reads (100 documents + 100 rule evaluations). At family scale this is ~cents/month, but worth knowing.

## Implications for Roadmap

Based on combined research across stack, features, architecture, and pitfalls — with the primary constraint being "deploy this week" — the suggested phase structure is:

### Phase 1: Deploy Infrastructure (Days 1-2)
**Rationale:** Everything stops until the app is live. Vercel hosting, Firebase project config, and environment variables are prerequisites for any real-world testing. The app has zero value sitting on a local machine.

**Delivers:** A working, accessible web app at a production URL. Users can sign in, create lists, scan barcodes, and manage pantry.

**Addresses from FEATURES.md:** P0 deploy configuration items. All existing table-stakes features become usable.

**Avoids from PITFALLS.md:**
- SPA 404 on refresh (Pitfall 6) — `vercel.json` rewrites in place before deploy
- `VITE_` prefix misconfiguration (Pitfall 5) — env validation + naming fixes applied
- `signInWithRedirect` Safari/Firefox (Pitfall 4) — switched to `signInWithPopup`
- Vite subdirectory base path (Pitfall 13) — verify `base: '/'` before deploy

**Tasks from PROJECT.md:** DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04

**Key decisions to make:**
- Use `signInWithPopup` (over redirect) — confirmed working cross-browser
- Single Firebase project for dev+prod (acceptable for personal use)
- Accept NVIDIA key exposure for v1; document the decision

**Research flag:** LOW — standard Vercel + Firebase deploy procedure, well-documented. Skip `/gsd-research-phase`.

### Phase 2: Quality Gates — CI/CD + Critical Tests (Days 2-3)
**Rationale:** With the app live, the next priority is ensuring changes don't break it. Zero tests today means every deploy is a gamble. CI/CD with progressive gates (lint → typecheck → test → build → deploy) catches errors before they reach production. This phase focuses on the highest-ROI tests: pure functions and API wrappers with MSW.

**Delivers:** Automated pipeline that blocks broken code from reaching production. Coverage for the most fragile parts (AI API, barcode API, utility functions).

**Uses from STACK.md:** GitHub Actions CI workflow, Vercel CLI `build --prebuilt` pattern, Sentry integration for error monitoring

**Implements from ARCHITECTURE.md:** Vitest 4 + MSW setup, progressive quality gates, package.json scripts

**Avoids from PITFALLS.md:**
- Missing error boundaries (Pitfall 10) — Sentry catches unhandled errors
- `onSnapshot` cleanup bugs (Pitfall 3) — hook tests verify unsubscribe on unmount
- NVIDIA rate limit handling (Pitfall 18) — AI API wrapper tests cover retry logic

**Tasks from PROJECT.md:** TEST-01, TEST-02, TEST-03, CI-01, CI-02

**Research flag:** LOW — Vitest + MSW + GitHub Actions is well-established. The ARCHITECTURE.md provides complete config. Skip `/gsd-research-phase`.

### Phase 3: Polish the Core (Days 3-5)
**Rationale:** The app is live and protected by CI. Now fix the rough edges that determine whether users _keep_ using it after day 1. Loading/empty/error states make the app feel complete even when things go wrong. Error boundaries prevent blank screens. Removing unused deps reduces bundle size. These changes are high-impact, low-risk, and can be deployed daily through the new CI pipeline.

**Delivers:** An app that handles errors gracefully, loads quickly, and doesn't surprise users with blank screens or broken navigation.

**Addresses from FEATURES.md:** P1 polish items. The app goes from "works" to "feels good."

**Avoids from PITFALLS.md:**
- Silent error swallowing (Pitfall 10) — all `catch {}` blocks replaced with user-facing toasts
- OpenAI SDK in devDependencies (Pitfall 16) — moved to dependencies

**Tasks from PROJECT.md:** POLISH-01 through POLISH-07

**Research flag:** LOW — standard React patterns. No research phase needed.

### Phase 4: Wire Up Promised Features — AI Insights + Activity Log (Days 5-7)
**Rationale:** This is the embarrassing gap — two features that exist in the data model and spec but never write to Firestore. AI insights is in the product name. Shipping without it means the app doesn't deliver on its core promise. Activity log is expected in any shared list app. These are medium-complexity wiring tasks (each 1-5 days) that make the app complete.

**Delivers:** AI shopping insights appear on the dashboard. Activity log tracks all changes in shared lists. The app now delivers on everything "GrocAI" promises.

**Addresses from FEATURES.md:**
- FEAT-02 (AI insights) — P0, core value prop
- FEAT-01 (activity log) — P0, expected transparency in shared lists

**Avoids from PITFALLS.md:**
- Infinite loop with insight generation (Phase warning for FEAT-02) — add debouncing and deduplication
- `onSnapshot` leak from new listeners — ensure cleanup on insight generation listeners

**Tasks from PROJECT.md:** FEAT-01, FEAT-02

**Research flag:** MEDIUM — the Firestore write patterns are straightforward, but AI insight generation logic may need prompt engineering iteration. May need `/gsd-research-phase` if NVIDIA prompt responses are inconsistent.

### Phase 5: Feature Growth — Autocomplete, History, Price Display (Weeks 2-3)
**Rationale:** With a solid, polished, feature-complete base deployed, now add the quick wins that dramatically improve daily use. Item autocomplete from purchase history saves 80% of typing for recurring shoppers. Price estimates in list view provide the "running total" users increasingly expect. These are low-effort, high-impact features that the data model already supports.

**Delivers:** Faster item entry (autocomplete from history), running total while building a list, expiry warnings on dashboard, "who added what" display in shared lists.

**Addresses from FEATURES.md:** P2 items, common missing features (#1, #4, #6).

**Tasks from PROJECT.md:** FEAT-03 (code splitting, deferred from Phase 3 if needed)

**Research flag:** LOW — standard patterns, data model exists. Skip `/gsd-research-phase`.

### Phase 6: Architecture Hardening (Weeks 3-4)
**Rationale:** Now that the app has real users and data, harden the architecture for growth. Add Firebase emulator integration tests (Firestore rules validation). Tighten coverage thresholds. Add hook and component tests for domain logic. Evaluate offline strategy improvements. These are high-confidence safeguards that prevent regressions as the feature set grows.

**Delivers:** Confidence that Firestore security rules work as intended. Coverage thresholds that block regressions. Better offline experience.

**Implements from ARCHITECTURE.md:** Firebase emulator tests, component tests, tightened coverage thresholds, PWA offline strategy

**Avoids from PITFALLS.md:**
- Rules not tested before deploy (Pitfall 17) — automated via emulator
- No offline data strategy (Pitfall 20) — explicit cache sizing + offline UI states
- Firestore hotspotting (Pitfall 14) — auto-generated IDs confirmed

**Tasks from PROJECT.md:** Would be new tasks after initial deploy

**Research flag:** LOW — Firebase emulator patterns are well-documented. Skip `/gsd-research-phase`.

### Phase 7+ : Differentiators — Recipes, Meal Planning, Spending (V2+)
**Rationale:** These are the features that would make GrocAI genuinely competitive with the best apps in the category, but they require significant new infrastructure. Recipe import needs an ingredient parsing pipeline and recipe storage. Meal planning needs a calendar UI and depends on recipes. Spending analytics needs a trip aggregation concept. These are 1-4 week features that should be driven by real user demand, not speculation.

**Delivers:** Recipe URL import → ingredient extraction → add to list. Weekly meal planning calendar with smart ingredient consolidation. Spending analytics by category, trip, and time.

**Addresses from FEATURES.md:** The biggest differentiator gaps.

**Research flag:** HIGH — recipe import and Danish store price APIs need significant research. Danish recipe sources (Madensverden, Arla APIs) and store price APIs (PriceTracker.dk capabilities) have unknown availability. Requires `/gsd-research-phase` before any implementation.

### Phase Ordering Rationale

- **Dependency order:** Deploy → CI/CD → Polish → Wire features → Growth → Harden. Each phase unblocks the next. Deploy must come first because there's no app to iterate on. CI/CD must come before significant code changes (Phases 3-5) to prevent regressions. Wire features before feature growth because the app must deliver its core promise before adding bells and whistles.
- **Risk reduction:** The worst failure modes (blank screen, auth failure, 404 on refresh) are addressed in Phases 1 and 3. The most likely silent failures (AI insights not working, activity log not tracking) are addressed in Phase 4. By Phase 5, there's a safety net (CI/CD) and a polished base to build on.
- **User perception:** Shipping Phase 1 alone gives a "working app." Phase 2 is invisible to users but prevents future frustration. Phase 3 makes the app "feel good." Phase 4 makes it "deliver on its name." Each phase creates a demonstrably better product.
- **Pitfall avoidance:** The most critical pitfalls (SPA 404, VITE_ prefix, Safari auth, SW stale cache) are all addressed in Phases 1-3. Not a single critical pitfall is deferred beyond Phase 3.

### Research Flags

Phases needing deeper research during planning:
- **Phase 7 (Recipes + Meal Planning):** HIGH — Danish recipe sources and ingredient parsing pipelines need investigation. No Danish-specific research in the current report. `/gsd-research-phase` required.
- **Phase 4 (AI Insights wiring):** MEDIUM — Firestore writes are straightforward, but NVIDIA prompt quality for insight generation needs iteration. May need brief research if responses are inconsistent.
- **Danish market validation:** LOW overall in the features research. Price comparison and store API integration feasibility is unknown for Danish chains (Rema 1000, Netto, Føtex, etc.). Flag for any future store-integration features.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Deploy):** Vercel + Firebase deploy is well-documented, zero-config for Vite
- **Phase 2 (CI/CD):** Vitest + MSW + GitHub Actions is the standard 2026 pattern
- **Phase 3 (Polish):** React error boundaries, loading states, unused dep cleanup — standard engineering
- **Phase 5 (Feature Growth):** Autocomplete, price display, purchase history — standard patterns, data model exists
- **Phase 6 (Architecture Hardening):** Firebase emulator, coverage thresholds — well-documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Vercel docs, Firebase docs, Vite docs all consistent. NVIDIA key exposure is the only risk and it's a documented tradeoff, not a gap. |
| Features | HIGH | Multiple independent app comparison sources (16+ apps analyzed) agree on table stakes and differentiators. GrocAI's current state verified against codebase. Complexity estimates are MEDIUM but conservative. |
| Architecture | HIGH | Testing patterns are well-established (Vitest + MSW + testing-library). Vercel CI/CD pattern from official docs. Two-tier Firestore testing strategy is the community standard. |
| Pitfalls | HIGH | Every pitfall sourced from official docs, GitHub issues, or Firebase community consensus. Risk levels are well-understood. Phase mappings are clear. |
| Danish market fit | LOW | Research was primarily global/US market apps. Danish recipe sources, store APIs, and shopping patterns may differ. Flagged for future investigation. |

**Overall confidence:** HIGH

The research is strong across all four dimensions. The stack is standard, the feature landscape is well-understood, the architecture patterns are established, and the pitfalls are documented with clear mitigations. The single LOW-confidence area (Danish market fit) is not blocking — it only matters for Phase 7+ features that are deferred anyway.

### Gaps to Address

1. **Danish market validation:** Current feature research is US/UK-centric. Danish grocery patterns (smaller households, different store chains, recipe sources) may differ. **Action:** Accept for v1. Investigate before Phase 7 (recipes) or any store-integration feature.

2. **Item autocomplete verification:** The FEATURES.md notes that autocomplete from purchase history "is not verified" — the data model may support it but the UI might not. **Action:** Verify during Phase 1 by checking if AddItemSheet queries purchase history.

3. **Price estimate display:** `estimatedPrice` + `currency` exist in the ListItem data model but may not be displayed. **Action:** Check UI during Phase 1 or Phase 3 polish. If not displayed, it's a quick win during Phase 5.

4. **NVIDIA NIM Danish language quality:** The AI categorization and enrichment might not handle Danish item names correctly. **Action:** Test with real Danish product names during Phase 1. If quality is poor, the prompt needs iteration.

5. **Purchase history mechanism:** No clear "repeat last order" or purchase history query exists. **Action:** Investigate during Phase 5 when implementing autocomplete.

6. **Firebase emulator test reliability:** Known jsdom compatibility issue (Firebase SDK #8137). The `@vitest-environment node` workaround is documented but needs verification in this project's setup. **Action:** Flag during Phase 2 test setup — don't block the initial deployment on this.

## Sources

### Primary (HIGH confidence)
- Vercel Vite deployment docs — verified 2026-03
- Firebase documentation (Auth, Firestore, Security Rules, App Check) — current
- Vite env vars and modes — current
- vite-plugin-pwa deployment guides — current
- Sentry React + Vite plugin docs — current (v5.2.0, April 2026)
- Vitest 4 configuration + Vite 8 compat — vitest.dev, GitHub #9587
- React Testing Library v16.3.2 (React 19 support) — GitHub releases
- MSW v2 + Vitest integration — vitest.dev/guide/mocking/requests
- NVIDIA NIM API security docs — current
- Firebase Auth redirect best practices — current

### Secondary (MEDIUM confidence)
- Grocery app comparison studies (iofill, What's For Dinner, NerdWallet, GroceryChop) — 5+ independent sources agree
- Apple/Google Play review analysis — user sentiment patterns from multiple reviews
- Firebase Security Rules common mistakes (CheckVibe) — blog source, March 2026
- NVIDIA NIM free tier rate limits (aiHola) — blog source, April 2026
- Vercel SPA routing community fixes — DEV Community, community.vercel.com
- Firebase emulator + Vitest known issues — GitHub #8137, #6905

### Tertiary (LOW confidence)
- Grocery app vendor sites (SmartGrocy, Grocefully, GroceryBudget, Ollie) — used only for feature inspiration, not architectural decisions
- Danish market grocery patterns — inferred, not directly researched
- Recipe import / meal planning in Danish context — not researched, flagged for Phase 7

---

*Research completed: 2026-05-09*
*Ready for roadmap: yes*
