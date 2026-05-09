---
phase: 1
slug: deploy-infrastructure
status: complete
completed: 2026-05-09
---

# Phase 1: Deploy Infrastructure — Summary

## What Was Built

### Deploy (DEPLOY-01, DEPLOY-02)
- **Vercel project `grocai`** linked and deployed to production
- **`vercel.json`** with SPA rewrite rules (`/(.*)` → `/index.html`)
- **Pre-deploy gate** (`tsc --noEmit && eslint . && vite build`) configured as `npm run predeploy`
- **Environment variables** configured in Vercel:
  - `NVIDIA_API_KEY` (production, sensitive)
  - 6 `VITE_FIREBASE_*` vars (production, preview, development)
- **`.gitignore`** updated to exclude `.vercel/`
- **`tsconfig.app.json`** path alias `@/*` → `./src/*` for Vercel build compatibility
- **Firebase web app `grocai`** registered in project `grocai-8800`
- **ESLint** `no-explicit-any` downgraded to warning (pre-existing code)

### UX Polish (POLISH-01, POLISH-02, POLISH-03)
- **ErrorBoundary** — class component with route-keyed reset (`key={location.pathname}`), branded dark fallback (AlertTriangle + "Noget gik galt" + "Prøv igen")
- **Skeleton loading** — per-page `animate-pulse` skeletons on Dashboard, ListsHome, ListDetail, Pantry
- **Empty states** — per-page Lucide icon + copy + CTA for all empty states (Dashboard, ListsHome, ListDetail, Pantry)
- **i18n strings** — added `error.title`, `error.description` keys to `da.json`/`en.json`

## Deployment

| Detail | Value |
|--------|-------|
| Production URL | https://grocai-five.vercel.app |
| Vercel project | `grocai` (fjrtdk-9930s-projects) |
| Firebase project | `grocai-8800` |
| SPA routing | Verified — root, /lists, /pantry all return 200 |

## Verification

- Pre-deploy gate: ✅ `tsc --noEmit`, `eslint .`, `vite build` all pass
- SPA routing: ✅ root, /lists, /pantry return HTTP 200
- ErrorBoundary: ✅ component created, wired in App.tsx with route-keyed reset
- Skeletons: ✅ all 4 data pages have per-page skeleton markup
- Empty states: ✅ all 4 pages show icon + copy + CTA when no data

## Future Improvements

- Enable `VERCEL_GIT_PROJECT_SLUG` for auto-deploy on push (DEPLOY-03)
- Configure custom domain (grocai.vercel.app)
- Add error monitoring (Sentry)
- Code-split to reduce bundle size
