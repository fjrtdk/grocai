# Domain Pitfalls: React SPA + Firebase + NVIDIA NIM

**Domain:** Client-side Firebase app with AI APIs in the browser
**Researched:** 2026-05-09
**Overall confidence:** HIGH

---

## Critical Pitfalls

Mistakes that cause rewrites, data breaches, or significant cost overruns.

### Pitfall 1: NVIDIA API Key Exposed in Client Bundle

**What goes wrong:** The `VITE_NVIDIA_API_KEY` environment variable is bundled into client-side JavaScript at build time. Any user can extract it from the browser's DevTools (Network tab → request headers, or searching bundle source for "nvapi-").

**Why it happens:**
- Vite's `VITE_` prefix convention exposes variables to client code — that's the intended behavior
- `src/lib/ai.ts` sets `dangerouslyAllowBrowser: true` on the OpenAI SDK to make API calls directly from the browser
- The key is a static string in the built JS bundle, trivially extractable

**Consequences:**
- Anyone who extracts the key can make NVIDIA NIM API calls on your account
- Costs rack up on your NVIDIA account (the NIM free tier is rate-limited to ~40 RPM, but extracted keys can be used from any IP, making abuse detection harder)
- Keys cannot be scoped to specific origins or referrers — NVIDIA NIM API keys are bearer tokens

**Prevention:**
1. **Critical:** Add a proxy endpoint or Cloud Function. Never call NVIDIA NIM directly from the browser. A Vercel Edge Function or Firebase Cloud Function can forward requests, keeping the key server-side.
2. **Minimum viable mitigation if no backend possible:** Use Vercel Rewrites to proxy `/api/ai/*` → NVIDIA endpoint, keeping the key in a server-side env var. This requires Vercel Pro or similar.
3. **Validation check at build time:** Add a build step that greps `dist/assets/*.js` for `nvapi-` and fails the build if found.
4. **Key rotation:** NVIDIA NIM keys are long-lived. Set calendar reminders to rotate them monthly.

**Detection:**
- Search built bundle: `grep -r 'nvapi-' dist/assets/*.js`
- Watch NVIDIA billing dashboard for unexpected usage spikes
- Monitor the NIM API usage logs if available

**Phase mapping:** This is the #1 security issue for DEPLOY-03 (configure NVIDIA key) and must be addressed before going live.

---

### Pitfall 2: Firestore Security Rules `get()` Calls Inflating Read Costs

**What goes wrong:** The existing security rules use `get()` to look up the parent list document every time a subcollection item is read or written. Each `get()` call in a security rule is a **billed Firestore read** — even when the rule denies the request.

**Why it happens:**
- In `firestore.rules:16-19`, every read/write on `/lists/{listId}/items/{itemId}` calls `get(/databases/$(database)/documents/lists/$(listId))` to check membership
- In `firestore.rules:23-28`, the same pattern for `/activity/{eventId}`
- Each rule evaluation triggers a billed read of the parent list document
- For a query returning 50 items, that's 50 rule evaluations × 1 `get()` each = **50 extra reads** beyond the 50 document reads
- Rule evaluation reads are charged even when the data has not changed (e.g., reconnection, rule update)

**Consequences:**
- 2× read cost on every item/activity query (one for the document, one for the rule `get()`)
- Time-based billing example: loading a list with 100 items once per hour = 4,800 extra reads/day just from rules

**Prevention:**
1. Use custom claims (`auth.token`) to store role/membership instead of `get()`. Set via Admin SDK when a user is added to a list. This is a zero-cost read in rules.
2. If custom claims won't work (dynamic membership), accept the cost but know about it. At personal-use scale (single family, <1000 items), this is ~cents/month — not a crisis but good to know.
3. Avoid using `get()` in rules that evaluate on every subcollection read. Restructure to check membership at the list document level instead.

**Detection:**
- Monitor Firestore usage in GCP Console → Firestore → Usage
- Compare "Rule Evaluations" vs "Document Reads" in billing reports

**Phase mapping:** TECH DEBT / incremental — revisit during DEPLOY-02 (Firebase project configuration).

---

### Pitfall 3: `onSnapshot` Listener Memory Leaks and Phantom Reads

**What goes wrong:** Firestore's `onSnapshot` listeners are not cleaned up when React components unmount, causing:
- Memory leaks (listeners hold references to component state)
- Phantom Firestore reads (listeners continue to receive updates in the background after navigation)
- Stale data appearing after navigation (listeners from previous pages still updating state)

**Why it happens:**
- `onSnapshot` returns an unsubscribe function, but many hooks don't call it in the `useEffect` cleanup
- Multiple components mount independent listeners for the same query (e.g., Dashboard + ListsHome both call `useLists()`)
- Navigation creates new listeners without destroying old ones

**Consequences:**
- Continuous Firestore read charges for listeners on unmounted pages
- React "Can't perform a React state update on an unmounted component" warnings
- Eventually: browser memory pressure from accumulated listeners and cached data

**Prevention:**
- Every `onSnapshot` call in `useEffect` must return the unsubscribe function:
  ```typescript
  useEffect(() => {
    const unsubscribe = onSnapshot(query, (snapshot) => { ... });
    return unsubscribe; // NOT unsubscribe() — return the function reference
  }, [deps]);
  ```
- Deduplicate listeners at the app level (use a single source of truth like React context or a lightweight store)
- Add a listener registry + cleanup on route change (React Router `useBlocker` or custom hook)

**Detection:**
- Browser DevTools → Application → IndexedDB → firestore/[project]/main — check for accumulated data
- React DevTools profiler — look for components re-rendering when they shouldn't be
- Firestore usage dashboard — unexpected sustained read counts after user stops interacting

**Phase mapping:** Address in TEST phase. This is a common bug that testing catches.

---

### Pitfall 4: `signInWithRedirect` Broken on Safari/Firefox Due to Third-Party Cookie Blocking

**What goes wrong:** `signInWithRedirect()` opens a cross-origin iframe to `<project>.firebaseapp.com` to handle OAuth. Safari (since 16.1), Firefox (since 109+), and Chrome (phasing in) block third-party storage access, causing the redirect flow to silently fail — user is redirected back but remains unauthenticated.

**Why it happens:**
- Firebase Auth's redirect flow uses an iframe on your `authDomain` (default: `project.firebaseapp.com`)
- Browsers with ITP (Intelligent Tracking Prevention) or Total Cookie Protection block the iframe's storage access
- `getRedirectResult()` returns `null` — no error, no user, just silent failure

**Consequences:**
- Users on Safari or Firefox can't sign in via redirect
- Error is silent: no console error, no UI feedback — user just sees they're not logged in
- This is the default experience for a significant portion of users (~20-30% browser share)

**Prevention:**
1. **Switch to `signInWithPopup()`** — the simplest fix. Popups are blocked less often than redirects.
2. **If using redirect:** Deploy Vercel rewrites to proxy `https://yourdomain.com/__/auth/*` → `https://project.firebaseapp.com/__/auth/*`. Add `vercel.json` rewrites.
3. Set `authDomain` to your custom domain (requires Firebase Hosting or self-hosting the auth handler).
4. Add an authorized redirect URI for your custom domain in Google Cloud Console Credentials.

**Detection:**
- Test sign-in in Safari and Firefox (private browsing mode)
- Check browser console for "cross-origin" or "storage access" warnings
- `onAuthStateChanged` returns `null` regardless of successful OAuth redirect

**Phase mapping:** Critical for DEPLOY-01/DEPLOY-02. Must be addressed before any user visits the deployed app.

---

### Pitfall 5: Vite `VITE_` Prefix Misconfiguration Leading to Silent `undefined` Values

**What goes wrong:** Environment variables without the `VITE_` prefix are `undefined` in the client bundle. Vite strips non-`VITE_` variables at build time for security. The app silently receives `undefined` values for Firebase config, causing auth failures, database connection issues, and broken features — all without clear errors.

**Why it happens:**
- Only `VITE_`-prefixed variables are accessible via `import.meta.env` in client code
- `.env.production` is only loaded during `vite build`, not during dev with `.env.development`
- Variables in `.env.development` won't exist in production builds
- Deploy platforms (Vercel) need env vars set in their dashboard — `.env` files are not uploaded
- No validation — missing variables don't error at build time, only at runtime

**Consequences:**
- Firebase `initializeApp()` succeeds with `undefined` values but auth calls immediately fail with `auth/invalid-api-key`
- Firestore operations silently fail or create documents with wrong project
- Debugging is time-consuming because `undefined` doesn't throw — it just doesn't work

**Prevention:**
1. **Add build-time validation:**
   ```typescript
   // src/lib/env.ts
   const requiredVars = [
     'VITE_FIREBASE_API_KEY',
     'VITE_FIREBASE_AUTH_DOMAIN',
     'VITE_FIREBASE_PROJECT_ID',
     'VITE_FIREBASE_STORAGE_BUCKET',
     'VITE_FIREBASE_MESSAGING_SENDER_ID',
     'VITE_FIREBASE_APP_ID',
   ] as const;
   
   for (const key of requiredVars) {
     if (!import.meta.env[key]) {
       throw new Error(`Missing env var: ${key}`);
     }
   }
   ```
2. Maintain both `.env.development` (local dev) AND `.env.production` (Vercel builds)
3. Set env vars in Vercel Project Settings → Environment Variables for production
4. Never use `process.env` in client code — Vite only supports `import.meta.env`

**Detection:**
- Add `console.log('Firebase config:', firebaseConfig)` after initialization during development
- Catch and display Firebase initialization errors
- CI build should fail if env vars are missing (use `dotenv-check` or custom script)

**Phase mapping:** DEPLOY-02 (Firebase project configuration). This is the single most common deployment blocker.

---

### Pitfall 6: SPA 404 on Page Refresh (Client-Side Routing + Static Hosting)

**What goes wrong:** Navigating to `/lists/abc123` and refreshing the page returns a 404. The browser requests `/lists/abc123` from the server, but only `/index.html` exists in the static deployment.

**Why it happens:**
- Vite produces a single `index.html` entry point
- React Router handles routing client-side via the History API
- The production web server doesn't know to serve `index.html` for unknown paths

**Consequences:**
- Users who bookmark or share deep links get 404 errors
- PWA "add to home screen" shortcuts break on refresh
- Feels broken — undermines trust in the app

**Prevention:**
- Add `vercel.json` rewrites to serve `index.html` for all routes:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- Add a React Router catch-all route `path="*"` with a 404 page (listed as POLISH-05)
- Set Cache-Control: `no-store` on `index.html` to avoid stale routes:
  ```json
  {
    "headers": [
      {
        "source": "/(.*).html",
        "headers": [
          { "key": "Cache-Control", "value": "no-store" }
        ]
      }
    ]
  }
  ```

**Detection:**
- Visit any deep link directly (not via in-app navigation)
- Hard-refresh on a sub-route

**Phase mapping:** DEPLOY-01 (Vercel deployment). Must be in place before first deploy.

---

### Pitfall 7: PWA Service Worker Caching Stale App Shell

**What goes wrong:** The service worker precaches all app assets on first visit. When a new version is deployed, users continue to see the old UI until:
1. The service worker detects the update (can take 30-60 seconds)
2. The user navigates away and comes back (or closes/reopens the tab)
3. A hard refresh is performed

**Why it happens:**
- Workbox (used by `vite-plugin-pwa`) precaches assets by content hash in the service worker
- The service worker update lifecycle: `install` → `waiting` → `activate`
- By default, the new service worker stays in `waiting` until all tabs of the old version are closed
- Without `skipWaiting()` and `clientsClaim()`, updates never take effect on existing tabs

**Consequences:**
- Users see stale UI after deployment
- "Why isn't my fix showing up?" debugging frustration
- If data schema changes in Firestore, stale client code may write data in an old format

**Prevention:**
1. Enable `registerType: 'autoUpdate'` in `vite-plugin-pwa` config — this handles the update flow
2. In the service worker, add:
   ```javascript
   self.addEventListener('install', () => self.skipWaiting());
   self.addEventListener('activate', () => clientsClaim());
   ```
3. **Cache-Control for `index.html`:** Set to `no-store` or `no-cache` so the browser always checks for a new service worker
4. Add a skip-waiting prompt for users (optional but better UX):
   ```typescript
   // In app: listen for 'waiting' event, prompt user to update
   ```
5. Use `self.__WB_MANIFEST` in injectManifest mode for proper cache-busting

**Detection:**
- Deploy a minor visual change, observe if it appears on refresh
- Chrome DevTools → Application → Service Workers — check "Waiting" status
- Check Cache Storage in DevTools for old asset versions

**Phase mapping:** DEPLOY-04 (production build pipeline) and PWA testing. Known issue with `vite-plugin-pwa` — document it.

---

### Pitfall 8: Firestore Security Rules — Rules Are Additive, Not Restrictive

**What goes wrong:** Broad wildcard rules at the root level override specific restrictive rules on subpaths. Firestore rules are additive (OR logic): if **any** rule grants access, access is granted.

**Why it happens:**
- A catch-all rule like `match /{document=**} { allow read: if request.auth != null; }` at the top grants read to everything
- Any more specific rules below it that try to restrict access are meaningless — the broad rule already grants it

**Consequences:**
- All authenticated users can read all documents, despite attempts at fine-grained control
- Data exposure: user A can read user B's pantry items, insights, etc.
- The `members` check in the current rules is effective only because there's NO broad wildcard — but any future addition of such a wildcard would silently break all security

**Prevention:**
- **Never use `match /{document=**}` with permissive conditions at the root level**
- Always scope rules to specific collection paths
- Review rules whenever adding new collections
- Use the Rules Playground in Firebase Console to simulate access

**Current rules check:** The existing `firestore.rules` do NOT have a broad wildcard — good. But be vigilant not to add one.

**Detection:**
- `firebase deploy --only firestore:rules` should produce no warnings about overlapping rules
- Firebase Console rules page shows warnings for overlapping matches
- Rules Playground tests for unexpected access

**Phase mapping:** Ongoing — review rules with every new collection/feature.

---

## Moderate Pitfalls

### Pitfall 9: Firestore Broad Read Queries Without `limit()` — Cost Explosion

**What goes wrong:** Loading an entire collection with no `limit()` clause becomes exponentially more expensive as data grows. A query returning 5000 items costs 5000 reads every time.

**Why it happens:**
- Lists and pantry load all items into memory (noted in CONCERNS.md)
- No pagination or virtualization anywhere in the app
- Personal use today = small data, but family use over months = growing data

**Consequences:**
- At 500 items, 3 users each opening the app 10 times/day = 15,000 reads/day = ~$0.27/day on Blaze = ~$8/month just for list loading
- App becomes sluggish with 1000+ items (no virtualization)
- Firestore has a 1MB max document size and 20K write limit per document — an unbounded items array in a list document would hit these limits

**Prevention:**
- Add `limit(100)` as a safety net on every query
- Implement cursor-based pagination with `startAfter()`
- Use `getCountFromServer()` for badge counts instead of loading all documents
- Consider lazy-loading list items (only load items for the currently viewed list)

**Phase mapping:** TEST phase — these are high-impact, low-effort fixes.

---

### Pitfall 10: Missing Error Boundaries and Error Monitoring

**What goes wrong:** Silent `catch` blocks (noted in CONCERNS.md) swallow API errors. The app shows no indication that AI enrichment, barcode lookup, or Firestore operations have failed.

**Why it happens:**
- No try/catch wrapping on async operations in many places
- `AddItemSheet.tsx:59` has a silent catch block
- No Sentry or equivalent error tracking

**Consequences:**
- AI categorization silently fails → items show without categories
- Barcode lookup silently fails → no product info shown
- Users don't know operations failed — they see empty states and assume no data exists
- Debugging after deployment requires users to report "it didn't work" with no error context

**Prevention:**
1. Add a React Error Boundary at the App root level (POLISH-03)
2. Add Sentry or a lightweight error logger (POLISH-03)
3. Remove silent `catch {}` blocks — at minimum log to console + show a user-facing toast
4. Wrap Firebase/NVIDIA API calls in error-aware hooks that surface errors to the UI

**Phase mapping:** POLISH-03. Do this before or alongside DEPLOY-01.

---

### Pitfall 11: Firestore Rules Member Check Doesn't Validate Role Type

**What goes wrong:** The read rule `request.auth.uid in resource.data.members.keys()` checks membership but not role. This is correct for read (all members can read), but the write rule on items checks `in ['owner', 'editor']` which IS correct — however, there's no validation on create that prevents setting arbitrary role values.

**Why it happens:**
- List creation (`allow create: if request.auth != null`) doesn't validate what `members` field looks like
- A user could create a list with `{ members: { [otherUserUid]: 'owner' } }` and give another user ownership

**Consequences:**
- Low severity for personal use (only you + family have accounts)
- In a broader context: privilege escalation via crafted create request

**Prevention:**
- Validate the create request:
  ```
  allow create: if request.auth != null
    && request.resource.data.members.keys().hasOnly([request.auth.uid])
    && request.resource.data.members[request.auth.uid] == 'owner';
  ```
- On update, prevent changing ownership without current owner's consent

**Phase mapping:** LOW priority for personal use, but good hygiene. Address in a future security review phase.

---

### Pitfall 12: `onAuthStateChanged` Subscription Leak from Root Component

**What goes wrong:** If `onAuthStateChanged` is subscribed in a component that mounts/unmounts (like App.tsx with React Router), each mount creates a new subscription without cleaning up the old one.

**Why it happens:**
- `onAuthStateChanged` in a `useEffect` without a cleanup function
- React StrictMode in development mounts/unmounts twice, revealing the leak
- The function `onAuthStateChanged` returns IS the unsubscribe function — but it must be RETURNED, not called

**Consequences:**
- Multiple auth listeners accumulate
- Each listener triggers `setState` on auth state changes, causing extra re-renders
- Potential memory leak over long app sessions

**Prevention:**
```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    // handle auth state
  });
  return unsubscribe; // ← return the function, don't call it
}, []);
```
- For a single-page app, subscribe once at the root and use context, not in multiple components

**Phase mapping:** TEST phase. Check existing auth hook for this pattern.

---

### Pitfall 13: Vite Production Build Serving From Subdirectory Without `base` Config

**What goes wrong:** If the app is deployed at a sub-path (e.g., `https://example.com/grocery/`), all asset paths (`/assets/index-abc123.js`) resolve to the root, producing 404s for JS/CSS.

**Why it happens:**
- Vite defaults `base: '/'` in `vite.config.ts`
- Vercel/Netlify usually serve from root — no issue unless using a sub-path

**Consequences:**
- App loads but nothing renders — all JS/CSS requests return 404
- Very confusing because `index.html` loads

**Prevention:**
- Verify `vite.config.ts` has `base: '/'` (the default) — correct for root deployment
- If deploying to a sub-path, set `base: '/grocery/'` and configure Vercel to serve from that path
- Add a build-time check: `import.meta.env.BASE_URL !== '/'` warning

**Phase mapping:** DEPLOY-01 confirm before going live.

---

### Pitfall 14: Firestore Hotspotting with Auto-Generated Document IDs

**What goes wrong:** Writing new documents at a high rate with auto-generated IDs from Firestore can cause hotspotting at high throughput. Firestore's auto-IDs use a scatter algorithm, so this is actually fine for most use cases — but timestamps or monotonically increasing values used as document IDs WILL cause hotspots.

**Why it happens:**
- If activity log events use timestamps as doc IDs: `/activity/20260509T120000Z` — monotonically increasing = hotspot
- If barcode scans are stored with sequential IDs
- At personal-use scale (<1 write/second), this is not a practical problem

**Consequences:**
- At scale: latency spikes, deadline exceeded errors, write contention
- For personal use: negligible, but worth knowing for future growth

**Prevention:**
- Use Firestore's auto-generated document IDs (already the pattern in the codebase)
- If custom IDs are needed, use UUID v4 or similar random distribution
- Avoid timestamp-based document IDs

**Phase mapping:** Monitoring — not urgent for current scale.

---

### Pitfall 15: `onSnapshot` Listener Re-firing on Every Change Causing Read Multiplication

**What goes wrong:** With real-time listeners, every document change in the query result set triggers a re-read. `onSnapshot` charges one read per changed document — not per query.

**Why it happens:**
- Heavy item editing (checking off items, adding, removing) triggers individual document updates
- Each update in the watched collection causes `onSnapshot` to re-deliver the changed document
- If users rapidly check off 10 items, that's 10 reads from the listener + 10 writes

**Consequences:**
- Interactive editing sessions cost more than expected
- A user checking off 50 items in a shopping trip generates 50 reads from the listener + 50 writes
- At scale: meaningful cost increase

**Prevention:**
- Accept for personal use (cost is minimal at this scale)
- For future optimization: batch writes (multiple updates in a single `writeBatch`)
- Use `snapshotOptions: { includeMetadataChanges: false }` to avoid metadata-only events
- Consider using one-time `getDocs()` instead of `onSnapshot` for pages where real-time isn't critical

**Phase mapping:** Future optimization, not blocking deployment.

---

## Minor Pitfalls

### Pitfall 16: OpenAI SDK in `devDependencies` Instead of `dependencies`

**What goes wrong:** The `openai` package is in `devDependencies` but used at runtime for NVIDIA NIM calls. Production builds on Vercel may not include dev dependencies.

**Why it happens:**
- Vercel runs `npm install --production` or equivalent for serverless functions
- For a pure static SPA (no server), Vite bundles everything anyway — the dependency tree doesn't matter at runtime
- BUT: TypeScript types from `devDependencies` won't be available if someone runs `npm ci --production` before `tsc` in CI

**Consequences:**
- Currently harmless for Vite SPA builds (tree-shaken into bundle)
- Future CI issues if running type checking after production-only install
- Build warnings about runtime dependency in devDependencies

**Prevention:**
- Move `openai` to `dependencies` in `package.json` (listed as POLISH-02)

**Phase mapping:** POLISH-02. Quick fix.

---

### Pitfall 17: Firestore Rules Not Tested Before Deploy

**What goes wrong:** Rules are deployed without testing, and a typo like `resource.data.members.keys()` instead of `resource.data.members.keys()` (already correct in current rules) or a missing `get()` path causes either open access or total denial of service.

**Why it happens:**
- No automated rules testing in CI
- Manual `firebase deploy --only firestore:rules` without using emulator or Rules Playground
- Rules language is unfamiliar to most developers

**Consequences:**
- Deny of service: legitimate users can't read/write their data
- Data exposure: all users can read all data
- Both are equally bad for different reasons

**Prevention:**
- Test rules locally using Firebase Emulator Suite: `firebase emulators:start --only firestore`
- Use the `@firebase/rules-unit-testing` library for automated rule tests
- Run Rules Playground tests in Firebase Console before every deploy
- Add a `firebase.json` pre-deploy hook that validates rules syntax

**Phase mapping:** Add during CI/CD setup (CI-01 or CI-02). This is a low-effort, high-safety win.

---

### Pitfall 18: NVIDIA NIM Free Tier Rate Limits Hit in Production

**What goes wrong:** The NVIDIA NIM free tier is rate-limited to ~40 requests per minute per model. For a single-user app doing AI categorization on item creation, this is fine. But batch operations (importing 50 items at once, generating insights for multiple lists) will hit 429 errors.

**Why it happens:**
- Free tier: 40 RPM, no guaranteed throughput
- Larger models (e.g., 49B parameter model used by GrocAI) may have slower response times during peak hours
- No retry logic with backoff in the AI wrapper

**Consequences:**
- Batch item imports get partial AI enrichment (some items categorized, some not)
- Insight generation may fail silently
- User confusion: "why does this item have a category and this one doesn't?"

**Prevention:**
- Add retry logic with exponential backoff in `src/lib/ai.ts` (429 responses)
- Queue AI requests and process them serially with delay between calls
- Show UI feedback: "AI enrichment queued..." instead of silent failure
- Consider caching AI results in Firestore to avoid repeat calls for the same product
- Monitor for 429 responses: log them and alert

**Phase mapping:** TEST-01 (unit tests for AI API wrapper) should include rate limit handling.

---

### Pitfall 19: User Enumeration via Email-Based Document Lookup

**What goes wrong:** `ShareDialog.tsx:32-36` queries Firestore by document ID using an email as the key: `getDoc(doc(db, 'users', email))`. This reveals whether a particular email has an account — an information disclosure vulnerability.

**Why it happens:**
- The users collection uses email as the document ID
- A getDoc call either returns a document (registered) or doesn't (unregistered)
- The result is used to decide whether to add the user to a shared list

**Consequences:**
- Low severity for personal use (you know your family members' email addresses)
- In a broader product: an attacker could enumerate registered emails
- Violates "don't leak authentication state" security principle

**Prevention:**
- For personal use: acceptable tradeoff for simplicity
- Stronger approach: use a Cloud Function that validates the requesting user is a member before checking
- Future fix: use a different lookup mechanism (e.g., store an invite code)
- At minimum: rate-limit the share dialog to prevent automated enumeration

**Phase mapping:** Known issue. Accept for v1, flag for future security hardening.

---

### Pitfall 20: No Offline Data Strategy for PWA

**What goes wrong:** The PWA has a service worker (from `vite-plugin-pwa`) configured for caching but no explicit offline data strategy. Users who add the app to their home screen and go offline (subway, grocery store basement) get empty screens.

**Why it happens:**
- `vite-plugin-pwa` precaches the app shell (JS/CSS/HTML) but not Firestore data
- Firestore's offline persistence is enabled but not configured with explicit cache sizes
- No loading states distinguish "offline with cached data" vs "offline with no data"

**Consequences:**
- PWA icon on home screen → user opens it in a store basement → blank screen
- "What's the point of a PWA if it doesn't work offline?" user frustration

**Prevention:**
- Enable Firestore offline persistence explicitly: `enableMultiTabIndexedDbPersistence(db)`
- Set cache size: `experimentalForceLongPolling` for aggressive offline support
- Add `Navigator.onLine` detection and show appropriate UI states
- Cache AI-enriched product data in Firestore for offline access (already persisted if offline mode is on)

**Phase mapping:** Post-deploy enhancement. Functional offline is a differentiator for a shopping list app.

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| **DEPLOY-01** (Vercel deploy) | SPA 404 on refresh (Pitfall 6) | Add `vercel.json` rewrites before first deploy |
| **DEPLOY-02** (Firebase config) | `VITE_` prefix missing → silent `undefined` (Pitfall 5) | Add env validation in `src/lib/env.ts` |
| **DEPLOY-03** (NVIDIA key) | API key in client bundle (Pitfall 1) | Add proxy endpoint or build-time grep check |
| **DEPLOY-04** (Build pipeline) | PWA stale cache after update (Pitfall 7) | Verify `skipWaiting()` + `clientsClaim()` in SW |
| **TEST-01/02** (AI + barcode tests) | Missing retry logic for NVIDIA rate limits (Pitfall 18) | Add exponential backoff to AI wrapper tests |
| **TEST-05** (Hook tests) | `onSnapshot` unsubscribe not called (Pitfall 3) | Write tests that verify cleanup on unmount |
| **CI-01** (GitHub Actions) | No rules testing in CI (Pitfall 17) | Add `@firebase/rules-unit-testing` step |
| **POLISH-05** (404 route) | Missing catch-all route (related to Pitfall 6) | Add `path="*"` to React Router |
| **FEAT-02** (AI insights) | Infinite loop: insight triggers listener → re-generates insight | Add debouncing and deduplication |
| **FEAT-03** (Code splitting) | Lazy-loaded chunk not in precache manifest → PWA offline breakage | Verify `vite-plugin-pwa` globPatterns includes lazy chunks |

## Sources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules) — HIGH confidence
- [GCP: Fix insecure rules](https://cloud.google.com/firestore/docs/security/insecure-rules) — HIGH confidence
- [Firebase Auth redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices) — HIGH confidence
- [Firestore billing documentation](https://firebase.google.com/docs/firestore/pricing) — HIGH confidence
- [Firestore best practices](https://firebase.google.com/docs/firestore/best-practices) — HIGH confidence
- [Vite env variables and modes](https://vite.dev/guide/env-and-mode) — HIGH confidence
- [Vite PWA plugin guide](https://vite-pwa-org.netlify.app/guide/service-worker-precache) — HIGH confidence
- [Firestore pricing explained (Firemap)](https://firemap.dev/blog/firestore-pricing-explained) — MEDIUM confidence (blog)
- [CheckVibe: Firebase Security Rules 8 Common Mistakes](https://checkvibe.dev/blog/firebase-security-rules-guide) — MEDIUM confidence (blog, Mar 2026)
- [NVIDIA NIM free tier rate limits (aiHola)](https://aihola.com/article/nvidia-nim-free-api-models) — MEDIUM confidence (blog, Apr 2026)
- [Firebase Auth signInWithRedirect Safari/Firefox issues (GitHub issues #7056, #6443, #1070)] — HIGH confidence
- [Vite SPA routing fix on Vercel (DEV Community)](https://dev.to/pwnkdm/fixing-routing-issues-in-vite-react-app-on-vercel-1o49) — MEDIUM confidence (community article)
- [Vite env vars not working (FixDevs)](https://www.fixdevs.com/blog/vite-env-variables-not-working/) — MEDIUM confidence (community article, Mar 2026)
- [Service worker update delay (vite-pwa GitHub issue #810)](https://github.com/vite-pwa/vite-plugin-pwa/issues/810) — HIGH confidence
- [Firestore rules get() billing (Stack Overflow)](https://stackoverflow.com/questions/69856450/firebase-security-rules-operating-fees) — MEDIUM confidence
- [React Firestore onSnapshot cleanup (Stack Overflow)](https://stackoverflow.com/questions/59855586/cleanup-not-working-in-useeffect-with-firebase-firestore-onsnapshot) — MEDIUM confidence
