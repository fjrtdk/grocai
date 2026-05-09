# Technology Stack — Deployment & Operations

**Project:** GrocAI
**Researched:** 2026-05-09
**Mode:** Ecosystem — Standard Vite + React + Firebase SPA deployment stack

## Recommended Stack

### Hosting & Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vercel** | — | Static SPA hosting + CDN | Zero-config Vite detection, auto HTTPS via Let's Encrypt, global CDN, git-integrated CI/CD, free hobby tier sufficient for personal app |
| **Firebase Console** | — | Firebase product config (Auth, Firestore, App Check) | Google-managed, no ops overhead, Security Rules editor built in |
| **Firebase CLI** | latest | Local security rules deployment + Firestore indexes | `firebase deploy --only firestore:rules,firestore:indexes` for targeted rule deploys |

### Environment Variables

| Variable | Source | Exposed to Client? | Risk Level |
|----------|--------|-------------------|------------|
| `VITE_FIREBASE_API_KEY` | Vercel Env Vars | ✅ Yes (build-time) | **LOW** — Firebase API keys are not secrets by design; restricted by allowed domains + App Check |
| `VITE_FIREBASE_AUTH_DOMAIN` | Vercel Env Vars | ✅ Yes | **NONE** — public config |
| `VITE_FIREBASE_PROJECT_ID` | Vercel Env Vars | ✅ Yes | **NONE** — public config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Vercel Env Vars | ✅ Yes | **NONE** — public config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Vercel Env Vars | ✅ Yes | **NONE** — public config |
| `VITE_FIREBASE_APP_ID` | Vercel Env Vars | ✅ Yes | **NONE** — public config |
| `VITE_NVIDIA_API_KEY` | Vercel Env Vars | ✅ Yes (build-time) | **HIGH** — API key visible in browser bundles, can be extracted from JS |
| `NVIDIA_API_KEY` | Local only | ❌ No | — For local dev, code reads `VITE_NVIDIA_API_KEY` |

### Error Monitoring

| Technology | Purpose | Why |
|------------|---------|-----|
| **Sentry (free tier)** | Error tracking, source maps, session replays | Industry standard for React SPAs; free tier includes 5k errors/month; Vite plugin for auto source map upload; React 19 `createRoot` error handler support; React Router 7 instrumentation |

### SEO / Meta

| Technology | Purpose | Why |
|------------|---------|-----|
| **@vercel/og** or static `index.html` meta tags | Social sharing previews | Vercel OG image generation if needed; for personal PWA, static meta tags in `index.html` sufficient |

### Domain & DNS

| Technology | Purpose | Why |
|------------|---------|-----|
| **Vercel DNS** (or external registrar) | Custom domain | Vercel auto-provisions Let's Encrypt SSL; A record `76.76.21.21` for apex; CNAME to `cname.vercel-dns-0.com` for www |

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Repository                       │
│                                                              │
│  main branch ── push ──► GitHub Actions (lint + test + build)│
│                                                              │
│  Vercel webhook auto-deploys main branch                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Build                              │
│                                                              │
│  1. npm install                                               │
│  2. VITE_* env vars injected at build time                   │
│  3. npm run build = tsc -b && vite build                     │
│  4. Output: dist/ (static SPA)                               │
│  5. Source maps uploaded to Sentry via @sentry/vite-plugin   │
│  6. Deploy to Vercel Edge CDN                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vercel Edge Network                          │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ custom domain    │  │ grocai.vercel.app│  │ Let's Encrypt│ │
│  │ (A / CNAME)     │  │ (preview URLs)   │  │ Auto SSL    │ │
│  └────────┬────────┘  └────────┬─────────┘  └──────┬──────┘ │
│           │                    │                     │        │
│           ▼                    ▼                     ▼        │
│  ┌─────────────────────────────────────────────────────┐     │
│  │         vercel.json rewrites → /index.html           │     │
│  │         PWA headers (SW, manifest, caching)           │     │
│  └──────────────────────┬──────────────────────────────┘     │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Browser (PWA)                             │
│                                                              │
│  ├─ Firebase Auth (Google sign-in)                           │
│  ├─ Firestore (real-time via onSnapshot)                     │
│  ├─ NVIDIA NIM API (via OpenAI SDK, browser -> direct)        │
│  ├─ Barcode APIs (PriceTracker, OpenFoodFacts)               │
│  ├─ Service Worker (Workbox, runtime cache for Firestore)    │
│  └─ Sentry (error reporting + session replay)                │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Files

### `vercel.json` (project root)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/manifest.webmanifest",
      "headers": [
        { "key": "Content-Type", "value": "application/manifest+json" }
      ]
    },
    {
      "source": "assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "cleanUrls": true,
  "trailingSlash": false
}
```

**Critical notes:**
- When `cleanUrls: true` is set, SPA rewrite destination should be `/index` (without `.html`). However, Vite's `index.html` at root works correctly with Vercel's Vite framework preset — the example above uses `/(.*)` → `/index.html` which is the officially documented approach for Vite on Vercel (per vercel.com/docs/frameworks/vite). If getting 404s on client-side routes, remove `cleanUrls` or change destination to `/index`.
- Service worker MUST have `Cache-Control: no-cache` — browsers will not update SW if it's cached.
- Manifest MUST have `Content-Type: application/manifest+json` — browsers reject manifests with wrong MIME type.

### `firebase.json` (project root)

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

Firebase is used only as a backend (Auth + Firestore), NOT for hosting. Hosting is Vercel. `firebase.json` scopes CLI commands to just rules + indexes deployment.

### `vite.config.ts` — Current + needed additions

Current config is good but needs:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'  // ADD

export default defineConfig({
  build: {
    sourcemap: 'hidden',  // ADD — needed for Sentry source maps, "hidden" avoids leaking to users
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'GrocAI',
        short_name: 'GrocAI',
        description: 'AI-drevet indkøbsliste og pantry-styring',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'da-DK',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
          },
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
          },
        ],
      },
      devOptions: { enabled: true },
    }),
    // Sentry plugin MUST be last (after all other plugins)
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
```

**Note:** The Sentry Vite plugin (`@sentry/vite-plugin` ^5.2.0) is a devDependency that uploads source maps to Sentry during `vite build`. It requires `sourcemap: 'hidden'` in build config — source maps exist for Sentry's use but aren't exposed to browser dev tools.

## Environment Variable Management

### Vite `VITE_` Prefix Rule

Vite automatically exposes env vars prefixed with `VITE_` to client code via `import.meta.env`. This is by design — the values are **statically replaced at build time** in the bundled JavaScript.

**Current `.env.example` has a naming mismatch:**

| Code reads | `.env.example` shows | Fix needed |
|---|---|---|
| `import.meta.env.VITE_NVIDIA_API_KEY` | `NVIDIA_API_KEY` | Change to `VITE_NVIDIA_API_KEY` |

### Client-Side API Key Security

**This warrants explicit understanding for this project:**

| Key | Exposed in Browser? | Mitigation |
|-----|-------------------|------------|
| Firebase API Key | ✅ Yes | Firebase API keys are designed to be public — security comes from App Check + authorized domains + Firestore Security Rules |
| NVIDIA NIM API Key | ✅ Yes **HIGH RISK** | Bundled into client JS via `dangerouslyAllowBrowser: true`. Anyone can extract it from browser dev tools |

**For a personal/family app**, this is arguably acceptable (limited threat surface, no $$ abuse beyond your NIM quota). But if the app ever expands beyond personal use, a proxy is required.

**Options to fix (in priority order):**

1. **Vercel Edge Middleware / Serverless Function** — Create a small API route (e.g., `/api/nvidia`) on Vercel that proxies requests to NVIDIA. The key stays server-side. Adds latency but full security. **Recommended if sharing with others.**
2. **Firebase Cloud Function** — Same proxy approach with Cloud Functions. Avoids adding another backend type but requires Blaze plan.
3. **Use NIM's free-tier usage limits** — Accept the risk for a personal app. NIM API keys can be rotated and are tied to your NVIDIA account.

### Vercel Env Var Configuration

Set these in Vercel Project Settings → Environment Variables:

| Variable | Scope | Environments |
|----------|-------|-------------|
| `VITE_FIREBASE_API_KEY` | Plain text | Production, Preview, Development |
| `VITE_FIREBASE_AUTH_DOMAIN` | Plain text | All |
| `VITE_FIREBASE_PROJECT_ID` | Plain text | All |
| `VITE_FIREBASE_STORAGE_BUCKET` | Plain text | All |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Plain text | All |
| `VITE_FIREBASE_APP_ID` | Plain text | All |
| `VITE_NVIDIA_API_KEY` | Plain text | Production, Preview |
| `SENTRY_AUTH_TOKEN` | Sensitive (masked) | Production only |
| `SENTRY_ORG` | Plain text | Production only |
| `SENTRY_PROJECT` | Plain text | Production only |

**Important:** Vercel "Preview" environments use the same env vars as Production by default. For NVIDIA API key, this means preview deployments can also call the API — acceptable for personal use but worth noting.

## Domain Setup + HTTPS

### Vercel Auto-HTTPS

Vercel provides automatic HTTPS for all deployments:
- `*.vercel.app` domains get wildcard Let's Encrypt certificates (HSTS preloaded, `max-age=63072000`)
- Custom domains get individual Let's Encrypt certificates (HSTS `max-age=63072000`, NOT preloaded)
- HTTP → HTTPS redirects are automatic (308 status code) and cannot be disabled

### Custom Domain Setup

1. **Add domain in Vercel Dashboard** → Project → Settings → Domains → Add
2. **Configure DNS** at your registrar:
   - Apex (`grocai.dk`): Add A record → `76.76.21.21`
   - www (`www.grocai.dk`): Add CNAME record → `cname.vercel-dns-0.com`
3. **Both apex and www** should be added as separate domains in Vercel; configure a redirect from one to the other
4. **SSL certificate** provisions automatically within minutes of DNS verification

### Firestore Authorized Domains

Add the production domain to Firebase Console → Authentication → Settings → Authorized domains:
- `grocai.vercel.app` (Vercel default)
- `grocai.dk` (custom domain, if used)
- `localhost` (for dev)

## Firebase Production Configuration

### Security Rules Deployment

Firestore rules are already in the project. Deploy them independently:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore  # one-time setup: picks existing firestore.rules + firestore.indexes.json
firebase deploy --only firestore:rules,firestore:indexes
```

### Firebase App Check (Recommended for Production)

App Check prevents abuse of Firebase resources by unverified clients:

1. **Register for reCAPTCHA v3** at https://console.cloud.google.com/apis/credentials (or Google Cloud Console → reCAPTCHA Enterprise API)
2. **Enable App Check** in Firebase Console → Security → App Check → reCAPTCHA Enterprise provider
3. **Add to client code:**
   ```typescript
   import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

   const appCheck = initializeAppCheck(app, {
     provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
     isTokenAutoRefreshEnabled: true,
   })
   ```
4. **Enforcement:** Monitor metrics in Firebase Console → App Check for a few days, then enable enforcement for Firestore + Auth
5. **Debug mode:** Use `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` during local dev (set in `index.html` before Firebase imports)

**Cost:** reCAPTCHA Enterprise is free for 10K assessments/month — well within personal use.

### Separate Firebase Projects for Environments

Firebase recommends separate projects for dev/staging/prod. For a personal app, a single project is acceptable but risky — accidental Firestore mutations in dev can pollute production data. At minimum:
- **Prod:** Firebase project with App Check enforced
- **Dev:** Same project is fine, but use `firebase deploy --only firestore:rules` carefully
- Better: Create a dev Firebase project and use env vars to switch config

## PWA Deployment Considerations

### Vercel-Specific PWA Requirements

| Requirement | Configuration | Verification |
|------------|---------------|--------------|
| Service worker served uncached | `vercel.json` header for `/sw.js` → `Cache-Control: no-cache` | Check Response headers in DevTools → Network tab |
| Manifest correct MIME type | `vercel.json` header for `manifest.webmanifest` → `Content-Type: application/manifest+json` | DevTools → Application → Manifest should load without errors |
| App runs over HTTPS | Vercel auto-HTTPS, no configuration needed | DevTools → Security panel → valid certificate |
| HTTP → HTTPS redirect | Automatic 308 redirect on Vercel | Visit `http://grocai.vercel.app` → should redirect |
| Offline support | Workbox SW in `vite-plugin-pwa` config caches app shell + runtime | DevTools → Application → Service Workers → "Offline" checkbox should work |

### Critical: Service Worker Update Strategy

Current config uses `registerType: 'autoUpdate'`. This means:
- When a new SW is detected by the browser, it immediately activates
- The browser refreshes to use the new version
- **Risk:** Users can lose in-flight data if the page refreshes mid-input

For a shopping app where users might be typing list items, consider `registerType: 'prompt'` in a future iteration to prompt before update. For a personal app with low stakes, `autoUpdate` is fine.

### Cache Strategy

Current `workbox` config uses:
- `NetworkFirst` for Firestore and Google API requests
- Glob pattern caching for static assets (JS, CSS, HTML)

**Recommendation:** No changes needed for v1. The cache-first approach for assets + network-first for API calls is correct for a PWA that shows fresh data while working offline.

## Error Monitoring Setup

### Sentry Integration (Recommended)

Sentry is the standard for React SPA error monitoring:

| Feature | Benefit | Cost |
|---------|---------|------|
| Error capture | Automatic uncaught exceptions + unhandled promise rejections | Free (5K errors/month) |
| React 19 error hooks | Catches errors from `createRoot` handlers (`onUncaughtError`, `onCaughtError`, `onRecoverableError`) | Free |
| Source maps | Readable stack traces via `@sentry/vite-plugin` | Free |
| Session Replay | See user's screen before error (10% sample rate on free) | Free tier limited |
| React Router 7 tracing | Performance tracing for route transitions | Free |

**Setup steps:**

1. **Create Sentry account** → Create project → Get DSN
2. **Install deps:**
   ```bash
   npm install @sentry/react
   npm install -D @sentry/vite-plugin
   ```
3. **Create `src/instrument.ts`:**
   ```typescript
   import * as Sentry from '@sentry/react'

   Sentry.init({
     dsn: 'https://your-dsn@sentry.io/your-project',
     integrations: [
       Sentry.browserTracingIntegration(),
       Sentry.replayIntegration(),
     ],
     tracesSampleRate: 0.1,      // 10% of sessions for tracing
     replaysSessionSampleRate: 0.1,
     replaysOnErrorSampleRate: 1.0, // always replay on error
   })
   ```
4. **Import `instrument.ts` first** in `main.tsx` (before all other imports):
   ```typescript
   import './instrument'
   import { createRoot } from 'react-dom/client'
   // ... rest of imports
   ```
5. **Add React 19 error handlers** to `createRoot`:
   ```typescript
   createRoot(document.getElementById('root')!, {
     onUncaughtError: Sentry.reactErrorHandler(),
     onCaughtError: Sentry.reactErrorHandler(),
     onRecoverableError: Sentry.reactErrorHandler(),
   }).render(<App />)
   ```
6. **Configure source maps** in `vite.config.ts` (see above).

### Alternatives Considered

| Option | Why Not |
|--------|---------|
| **Rollbar** | More expensive free tier (5K events/month vs Sentry's 5K errors + unlimited events); less mature React 19 integration |
| **TrackJS** | 8KB agent is appealing, but free tier is limited (3K sessions/month); fewer community resources |
| **Bugpilot** | Interesting "no code changes" approach but newer/less proven; React 19 support unclear |
| **Custom Firebase-based logging** | Captures only errors you explicitly log; no source maps, no session replay |

**Recommendation:** Sentry for v1. The free tier covers personal use, and the React 19 + React Router 7 integration is well-documented and mature.

## CI/CD Pipeline

### Recommended: GitHub Actions → Vercel

Vercel auto-deploys from GitHub via webhook (free on Hobby plan). But adding a CI step for linting + building before deploy catches errors before they reach production:

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_NVIDIA_API_KEY: ${{ secrets.VITE_NVIDIA_API_KEY }}
```

Then connect the GitHub repo to Vercel → Vercel deploys on push to main.

## Vercel Build Settings (Dashboard)

These are auto-detected but worth verifying:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` (auto-detected from package.json) |
| Output Directory | `dist` (auto-detected) |
| Install Command | `npm install` (auto-detected) |
| Node.js Version | 22.x (latest LTS) |
| Root Directory | `/` (project root) |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Hosting | **Vercel** | Firebase Hosting | Firebase Hosting has no free HTTPS CDN cache control for SPAs; Vercel offers better DX (git integration, preview deployments, simpler config) |
| Error monitoring | **Sentry** | Rollbar, TrackJS, Bugpilot | Sentry has best free tier for small projects + best React/Router integration + Vite plugin for source maps |
| Domain | **Vercel DNS** | Cloudflare, dnsimple, namecheap | Vercel auto-provisions SSL; Cloudflare proxying can interfere with Vercel's CDN. For simplicity, use Vercel DNS if domain bought there, or keep external registrar and just add A/CNAME records |
| Backend proxy | **Skip for v1** | Vercel Serverless Functions, Firebase Cloud Functions | For a personal app, direct browser → NVIDIA API calls are acceptable. Add a proxy when sharing with external users |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Vercel Vite deployment | **HIGH** | Official Vercel docs + vite-plugin-pwa docs + community confirmations all consistent |
| Firebase project setup | **HIGH** | Official Firebase docs; existing codebase already uses correct patterns |
| Environment variable management | **HIGH** | Vite docs are explicit about VITE_ prefix and security implications |
| PWA deployment on Vercel | **HIGH** | Official vite-plugin-pwa deployment guide for Vercel |
| Domain + HTTPS | **HIGH** | Vercel docs are comprehensive and current |
| Error monitoring | **HIGH** | Sentry docs are current (April 2026 @sentry/vite-plugin 5.2.0) |
| NVIDIA API key exposure | **CRITICAL FLAG** | Client-side key exposure is inherent to current architecture; documented tradeoff |

## Sources

- **Vercel Vite docs:** https://vercel.com/docs/frameworks/frontend/vite (verified 2026-03-09)
- **Vercel vercel.json:** https://vercel.com/docs/project-configuration/vercel-json (verified 2026-03-11)
- **Vite env vars:** https://vite.dev/guide/env-and-mode (current)
- **vite-plugin-pwa Vercel guide:** https://vite-plugin-pwa.netlify.app/deployment/vercel (current)
- **vite-plugin-pwa deployment requirements:** https://vite-plugin-pwa.netlify.app/deployment/ (current)
- **Sentry React docs:** https://docs.sentry.io/platforms/javascript/guides/react/ (current)
- **Sentry Vite plugin:** https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/vite (current)
- **Sentry Vite plugin npm:** https://www.npmjs.com/package/@sentry/vite-plugin (v5.2.0, April 2026)
- **Firebase App Check web:** https://firebase.google.com/docs/app-check/web/recaptcha-provider (current)
- **Firebase launch checklist:** https://firebase.google.com/support/guides/launch-checklist (current)
- **Vercel custom domain:** https://vercel.com/docs/domains/set-up-custom-domain (verified 2026-02-26)
- **Vercel SSL/TLS:** https://vercel.com/docs/cdn-security/encryption (current)
- **NVIDIA NIM API security:** https://docs.nvidia.com/nim/large-language-models/1.10.0/deploy-behind-proxy.html (current)
- **Vercel SPA routing community fix:** https://community.vercel.com/t/rewrite-to-index-html-ignored-for-react-vite-spa-404-on-routes/8412 (April 2025)
