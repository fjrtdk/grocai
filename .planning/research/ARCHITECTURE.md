# Testing & CI/CD Architecture

**Project:** GrocAI
**Domain:** Testing infrastructure and CI/CD for a React 19 + Vite 8 + Firebase SPA
**Researched:** 2026-05-09
**Overall confidence:** HIGH

## Executive Summary

This document defines the architecture for testing and CI/CD in GrocAI — a Danish-first grocery SPA with Firebase Auth/Firestore and NVIDIA NIM AI. The project has **zero test infrastructure** today and needs a build pipeline that runs lint → type-check → test → build → deploy to Vercel.

The architecture uses a **Testing Trophy** approach: heavy on integration tests (hooks + Firestore interaction logic), moderate on unit tests (pure functions, API wrappers), light on UI-only unit tests. MSW handles HTTP mocking for NVIDIA NIM and barcode APIs. Firestore mocking uses `vi.mock()` for unit tests and the Firebase Emulator for integration tests. Vercel deploys via GitHub Actions using the `vercel build --prebuilt` pattern.

### Key Architectural Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Test runner | Vitest 4.x | Native Vite integration, shares vite.config, Jest-compatible API |
| DOM environment | jsdom | Required for React component tests (not happy-dom — jsdom is the mature choice for React 19) |
| HTTP mocking | MSW (Mock Service Worker) v2.x | Official Vitest recommendation, intercepts at network layer, framework-agnostic |
| Firestore test strategy | Module mock for units, Emulator for integration | Unit tests need speed; integration tests need fidelity |
| Test isolation strategy | `afterEach(cleanup)` + `server.resetHandlers()` | Standard Vitest + MSW lifecycle pattern |
| Build tool | Vercel CLI in GitHub Actions | Build artifact in CI, deploy prebuilt (no rebuild on Vercel) |
| Code quality gates | ESLint → tsc → Vitest → build | Progressive: fail fast on lint, then types, then tests, then build |

---

## 1. Testing Framework Setup

### 1.1 Stack Versions (Verified)

| Package | Version | Status | Source |
|---------|---------|--------|--------|
| Vitest | ^4.1.5 | Requires Vite >=6, Node >=20 | vitest.dev |
| @vitejs/plugin-react | ^6.0.1 | Uses Oxc (not Babel), ships with Vite 8 | Vite 8 blog |
| @testing-library/react | ^16.3.2 | Supports React 19 via v16.1.0+ | GitHub releases |
| @testing-library/jest-dom | ^6.x | DOM matchers, works via jest-dom/vitest | testing-library docs |
| @testing-library/user-event | ^14.x | Simulates real user interactions (prefer over fireEvent) | testing-library docs |
| jsdom | ^26.x | Required DOM environment for Vitest | Vitest config |
| msw | ^2.x | Network layer interception, Vitest docs recommend it | vitest.dev/guide/mocking/requests |
| @vitest/coverage-v8 | ^4.1.5 | V8-based coverage (faster than Istanbul) | Vitest coverage docs |

**TypeScript 6.0 compatibility:** TypeScript 6.0 (stable March 23, 2026) is the last JS-based compiler before TS 7.0 (Go port). It's fully compatible with Vite 8 and Vitest 4. Key changes affecting tests: `moduleResolution: "classic"` removed (use `"bundler"`); `moduleResolution: "node"` deprecated (use `"nodenext"`). The project already uses `"bundler"` which is correct.

**Vite 8 re: Vitest:** Vitest 4.x gained Vite 8 beta support in February 2026 (commit `541280e`) and stable Vite 8 support by March 2026. Supabase upgraded to Vite 8 + Vitest 4 in April 2026 — confirming compatibility. Vite 8 uses Rolldown (Rust-based) internally; Vitest still uses Vite's dev server for test transforms, which works transparently.

### 1.2 Installation

```bash
# Core test runner + DOM environment
npm install -D vitest@^4 jsdom

# React Testing Library
npm install -D @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14

# MSW for HTTP mocking
npm install -D msw@^2

# Coverage
npm install -D @vitest/coverage-v8@^4
```

### 1.3 Configuration

There are two viable approaches for config. **Recommended: amend `vite.config.ts`** to keep a single source of truth, using `/// <reference types="vitest/config" />` for TypeScript support. A separate `vitest.config.ts` is warranted only if test configuration diverges significantly from dev config.

#### vite.config.ts (preferred — single source)

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({ /* ...existing config... */ })],
  resolve: {
    alias: { '@': '/src' },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/**/*.integration.test.ts'],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.d.ts',
        'src/test/**',
        'src/components/ui/**',         // shadcn-style primitives — don't test vendor-like code
        'src/i18n/**',                  // static JSON
        'src/**/*.stories.*',
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },

    // Performance
    pool: 'forks',               // forks > threads for jsdom + firebase compatibility
    poolOptions: {
      forks: { singleFork: false },
    },
  },
})
```

#### src/test/setup.ts

```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// Configure Testing Library
configure({ testIdAttribute: 'data-testid' })

// Clean up rendered DOM after each test
afterEach(() => {
  cleanup()
})
```

### 1.4 TypeScript Types

Add `vitest/globals` and `@testing-library/jest-dom` to the `types` array in `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  }
}
```

> **Note:** `globals: true` in Vitest config makes `describe`, `it`, `expect`, `vi`, `beforeEach`, etc. available without imports. Without it, import from `vitest` in every test file.

---

## 2. Testing Strategy (Testing Trophy)

### 2.1 Test Type Definitions

| Layer | Type | Environment | Speed | Fidelity | What to Test |
|-------|------|-------------|-------|----------|--------------|
| Pure functions | Unit | node/jsdom | ⚡ Instant | Low | `src/lib/utils.ts`, date formatters, validators |
| API wrappers | Unit | jsdom | ⚡ Instant | Medium | `src/lib/ai.ts`, `src/lib/barcode.ts` (mock fetch via MSW) |
| Firebase data access | Unit | jsdom | ⚡ Instant | Low | `src/lib/firebase.ts` (mock firestore module) |
| Custom hooks | Integration | jsdom | ⚡ Fast | Medium-High | `src/hooks/*` (mock firestore, real React render) |
| UI components | Unit | jsdom | ⚡ Fast | Low-Medium | `src/components/ui/*` (render + interaction) |
| Page components | Integration | jsdom | ⚡ Medium | Medium | `src/pages/*` (render with mocked data) |
| Firestore rules | Integration | node | 🐢 Slower | High | Security rules tests (via Firebase emulator) |
| E2E flows | E2E | browser | 🐢 Slowest | Highest | Full user journeys — DEFERRED |

### 2.2 What to Unit Test vs What to Integration Test

**Unit test (pure logic, fast, deterministic):**

- **`src/lib/utils.ts`**: `cn()`, `formatDate()`, `formatCurrency()`, any pure transformation — straightforward `expect(input).toBe(output)`
- **`src/lib/ai.ts`**: Test that the OpenAI SDK is called with correct params, that response parsing works, that error handling works. Mock the `openai` SDK at the module level.
- **`src/lib/barcode.ts`**: Test that parallel fetch calls are made to correct URLs, that the first successful response wins, that 404s fall through. Mock `fetch` per-test with MSW `server.use()`.
- **UI primitives** (`src/components/ui/`): Minimal — just test they render and accept children. These are shadcn-style wrappers; thorough testing adds little value.

**Integration test (component + hook + data, slower but higher ROI):**

- **Custom hooks** (`src/hooks/useLists.ts`, `useAuth.ts`, etc.): Test the hook with a mocked Firestore `onSnapshot` returning controlled data. Assert the hook returns correct loading/error/ready states.
- **Page components** (`src/pages/*`): Render with mocked data, assert correct sub-components render. Use MSW to mock any API calls made from the page.
- **Firestore read/write flows**: Use the Firebase Emulator to test actual Firestore read/write patterns. This is where security rules integration lives.

### 2.3 What NOT to Test (Anti-Features)

| Don't Test | Why |
|------------|-----|
| `firebase` SDK itself | Google tests it. Trust it works. |
| `openai` SDK itself | NVIDIA NIM API is OpenAI-compatible; SDK tested by OpenAI. |
| `react-zxing` | Camera scanning in tests is impractical. Test the wrapper, not the scanner. |
| Tailwind CSS classes | CSS-in-JS snapshot tests are brittle. Visual regression is E2E territory. |
| i18next translations | Use `t()` in tests with mock resources. Don't test that Danish translations exist. |
| Service worker (PWA) | Workbox is well-tested. Verify registration, ignore internals. |

### 2.4 File Naming Convention

```
src/lib/ai.ts              → src/lib/__tests__/ai.test.ts       (unit)
src/lib/barcode.ts          → src/lib/__tests__/barcode.test.ts   (unit)
src/hooks/useLists.ts       → src/hooks/__tests__/useLists.test.ts (integration)
src/components/ListCard.tsx → src/components/__tests__/ListCard.test.tsx (integration)
src/pages/ListsHome.tsx     → src/pages/__tests__/ListsHome.test.tsx (integration with router)

* Integration tests requiring Firebase Emulator:
src/lib/__tests__/firestore.integration.test.ts
```

Using `__tests__` directories colocated with source keeps imports clean and makes test relationships obvious.

---

## 3. Mocking Strategy

### 3.1 MSW for HTTP-Level Mocking (NVIDIA NIM + Barcode APIs)

**Architecture:** MSW intercepts at the `fetch()` level — no application code changes needed. This is the Vitest-recommended approach (`vitest.dev/guide/mocking/requests`).

**Setup:**

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // NVIDIA NIM API (OpenAI-compatible)
  http.post('https://ai.api.nvidia.com/v1/*', async ({ request }) => {
    const body = await request.json()
    // Return different responses based on model
    if ((body as any)?.model?.includes('nemotron')) {
      return HttpResponse.json({
        id: 'chatcmpl-mock',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              name: 'Mælk',
              category: 'Mejeri',
              storageArea: 'Køleskab',
            }),
          },
        }],
      })
    }
    return HttpResponse.json({
      id: 'chatcmpl-mock',
      choices: [{ index: 0, message: { role: 'assistant', content: 'Mejeri' } }],
    })
  }),

  // PriceTracker.dk
  http.get('https://pricetracker.dk/api/*', () => {
    return HttpResponse.json({
      name: 'Arla Letmælk',
      brand: 'Arla',
      price: 12.95,
    })
  }),

  // OpenFoodFacts
  http.get('https://*.openfoodfacts.org/*', () => {
    return HttpResponse.json({
      product: { product_name: 'Test Product', brands: 'Test Brand' },
      status: 1,
    })
  }),
]
```

```typescript
// src/test/mocks/node.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

```typescript
// src/test/setup.ts (augmented with MSW)
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/node'

configure({ testIdAttribute: 'data-testid' })

// Start MSW before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test for isolation
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Close MSW after all tests
afterAll(() => server.close())
```

**Per-test handler overrides:**

```typescript
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/node'

it('handles AI API failure gracefully', async () => {
  server.use(
    http.post('https://ai.api.nvidia.com/v1/*', () => {
      return new HttpResponse(null, { status: 503 })
    }),
  )
  // Test error handling...
})
```

### 3.2 Firestore Mocking

**Two-tier strategy:**

#### Tier 1: Module Mock for Unit Tests (fast, no emulator needed)

Use `vi.mock('firebase/firestore')` to mock individual Firestore functions:

```typescript
// src/lib/__tests__/firebase.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCollection = vi.fn()
const mockDoc = vi.fn()
const mockGetDocs = vi.fn()
const mockOnSnapshot = vi.fn()

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  onSnapshot: (...args: any[]) => {
    mockOnSnapshot(...args)
    return () => {} // unsubscribe
  },
  query: vi.fn((...args: any[]) => args),
  where: vi.fn(),
  orderBy: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}))

// Mock Firebase Auth too
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_auth, cb) => {
    cb(null) // unauthenticated by default
    return () => {}
  }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(() => ({})),
}))

describe('Firebase data operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches lists for a user', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'list-1', data: () => ({ name: 'Indkøb', ownerId: 'user-1' }) },
      ],
    })
    // ... test the data access layer
  })
})
```

#### Tier 2: Firebase Emulator for Integration Tests (slower, high fidelity)

Standard approach per Firebase docs and community practice:

```typescript
// src/test/emulator-setup.ts
import { afterEach, beforeEach } from 'vitest'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const FIRESTORE_EMULATOR_HOST = '127.0.0.1'
const FIRESTORE_EMULATOR_PORT = 8080
const AUTH_EMULATOR_HOST = 'http://127.0.0.1:9099'

const testConfig = {
  projectId: 'demo-grocai',
  apiKey: 'demo-key',
  authDomain: 'demo-grocai.firebaseapp.com',
}

let app: ReturnType<typeof initializeApp>
let db: ReturnType<typeof getFirestore>
let auth: ReturnType<typeof getAuth>

export function initEmulator() {
  app = initializeApp(testConfig, 'test-' + Date.now())  // unique name to avoid reconnect issues
  db = getFirestore(app)
  auth = getAuth(app)
  connectFirestoreEmulator(db, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT)
  connectAuthEmulator(auth, AUTH_EMULATOR_HOST, { disableWarnings: true })
  return { app, db, auth }
}

// Clear all data between tests via emulator REST API
export async function clearEmulatorData() {
  const baseUrl = `http://${FIRESTORE_EMULATOR_HOST}:${FIRESTORE_EMULATOR_PORT}`
  await fetch(
    `${baseUrl}/emulator/v1/projects/${testConfig.projectId}/databases/(default)/documents`,
    { method: 'DELETE' },
  )
  await fetch(
    `http://localhost:9099/emulator/v1/projects/${testConfig.projectId}/accounts`,
    { method: 'DELETE' },
  )
}
```

**Important caveat (verified from Firebase SDK issue #8137):** The Firebase Firestore SDK has an internal assertion failure when running in the jsdom environment. If you get `FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state`, use `// @vitest-environment node` at the top of emulator-based test files, or use a separate Vitest workspace configuration for integration tests with `environment: 'node'`.

**Recommended approach:** Mark emulator-dependent test files with the `@vitest-environment node` pragma:

```typescript
// @vitest-environment node
// src/lib/__tests__/firestore.integration.test.ts
```

This tells Vitest to use the `node` environment for this file only, avoiding the jsdom assertion issue while keeping the rest of the suite in jsdom.

### 3.3 Mocking Summary

| Target | Strategy | Tool |
|--------|----------|------|
| NVIDIA NIM API (HTTPS) | Network interception | MSW `http.post()` |
| Barcode APIs (HTTPS) | Network interception | MSW `http.get()` |
| Firestore (unit tests) | Module-level mock | `vi.mock('firebase/firestore')` |
| Firestore (integration) | Real emulator connection | Firebase Emulator via `emulators:exec` |
| Firebase Auth | Module-level mock | `vi.mock('firebase/auth')` |
| `openai` SDK | Module-level mock | `vi.mock('openai')` |
| `react-i18next` `useTranslation` | Module-level mock | `vi.mock('react-i18next')` |
| Console/logging | Spy | `vi.spyOn(console, 'error')` |
| `window` APIs | Global mock | `window.alert = vi.fn()` in setup |

---

## 4. GitHub Actions CI/CD Pipeline

### 4.1 Workflow Architecture

The pipeline has four sequential phases. Each phase gates the next:

```
[Push/PR] → Lint (ESLint) → Type Check (tsc) → Test (Vitest) → Build (tsc + vite) → Deploy (Vercel)
                                                                                         │
                                                                                    preview on PR
                                                                                    production on main
```

### 4.2 Full Workflow: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '22'

jobs:
  # ── Phase 1: Lint ────────────────────────────────────────
  lint:
    name: Lint
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  # ── Phase 2: Type Check ──────────────────────────────────
  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx tsc -b --noEmit

  # ── Phase 3: Test ────────────────────────────────────────
  test:
    name: Test
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx vitest run --coverage
        env:
          NVIDIA_API_KEY: ${{ secrets.NVIDIA_API_KEY }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/
          retention-days: 7

  # ── Phase 4: Build (gate before deploy) ──────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test]
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx tsc -b && npx vite build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          NVIDIA_API_KEY: ${{ secrets.NVIDIA_API_KEY }}
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 3

  # ── Phase 5: Deploy to Vercel ────────────────────────────
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### 4.3 Required GitHub Secrets

| Secret | Purpose | Source |
|--------|---------|--------|
| `VERCEL_TOKEN` | Vercel API authentication | Vercel Account → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel organization (team) ID | Vercel Project Settings → General |
| `VERCEL_PROJECT_ID` | Vercel project ID | Vercel Project Settings → General |
| `VITE_FIREBASE_API_KEY` | Firebase web API key | Firebase Console → Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Firebase Console → Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Firebase Console → Project Settings |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Firebase Console → Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | Firebase Console → Project Settings |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Firebase Console → Project Settings |
| `NVIDIA_API_KEY` | NVIDIA NIM API key | NVIDIA AI Console |

### 4.4 Vercel Deploy Architecture Detail

**Why `vercel build --prebuilt` instead of Vercel's built-in Git integration?**

The Vercel GitHub integration (GitHub App) auto-deploys on push but runs the build on Vercel's infrastructure. Using GitHub Actions with `vercel build` + `vercel deploy --prebuilt` gives us:

1. **Pre-deploy gates** — tests and lint run before the deploy step
2. **Deterministic builds** — same artifact tested and deployed
3. **No source code upload** — only the `.vercel/output` artifact is sent to Vercel
4. **Faster deploys** — skip Vercel's build step, just deploy prebuilt output

**Workflow structure (3-step pattern per Vercel KB):**

```
vercel pull --yes --environment=production --token=$TOKEN
  ↓ Pulls project config + env vars into .vercel/
vercel build --prod --token=$TOKEN
  ↓ Runs your build script, outputs to .vercel/output (Build Output API)
vercel deploy --prebuilt --prod --token=$TOKEN
  ↓ Uploads .vercel/output to Vercel, skips build on their end
```

**For preview deployments on PRs**, modify the deploy job:

```yaml
deploy-preview:
  name: Deploy Preview
  runs-on: ubuntu-latest
  needs: [build]
  if: github.event_name == 'pull_request'
  steps:
    - run: npm ci
    - run: npm install --global vercel@latest
    - run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
    - run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
    - run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
```

### 4.5 Firebase Emulator in CI (Future Phase)

For integration tests requiring the emulator, add a separate job:

```yaml
test-integration:
  name: Integration Tests (Emulator)
  runs-on: ubuntu-latest
  needs: [lint, typecheck]
  timeout-minutes: 15
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci

    - name: Cache Firebase emulators
      uses: actions/cache@v4
      with:
        path: ~/.cache/firebase/emulators/
        key: ${{ runner.os }}-firebase-emulators-${{ hashFiles('firebase.json') }}

    - name: Install firebase-tools
      run: npm install -g firebase-tools

    - name: Run integration tests with Firebase emulators
      run: npx firebase emulators:exec --project demo-grocai --only firestore,auth 'npx vitest run --project integration'
```

---

## 5. Code Quality Architecture

### 5.1 Quality Gates (in order of execution)

| Gate | Tool | Command | Fail Condition | Phase in CI |
|------|------|---------|----------------|-------------|
| Lint | ESLint 10 | `npm run lint` | Any lint error | 1 |
| Type check | TypeScript 6.0 | `npx tsc -b --noEmit` | Any type error | 2 |
| Unit + integration tests | Vitest 4 | `npx vitest run --coverage` | Any test failure OR coverage below thresholds | 3 |
| Build | tsc + Vite | `npm run build` | Build error | 4 |

### 5.2 Coverage Thresholds (initial — tighten over time)

```typescript
// In vite.config.ts test.coverage.thresholds
{
  statements: 70,
  branches: 60,    // Branches are harder to cover in UI tests
  functions: 70,
  lines: 70,
}
```

These thresholds are intentionally conservative for the initial setup. The project has zero tests today; shipping something and iterating is better than demanding 90% from day one. **Target: tighten to 80/70/80/80 after the first test round is established.**

Coverage enforcement should start as warnings (not CI failures) for the first week, then switch to error after the team is comfortable with the test setup.

### 5.3 ESLint Configuration

Already set up with `eslint.config.js` (flat config, ESLint 10). Current configuration covers:
- `typescript-eslint` recommended rules
- `eslint-plugin-react-hooks` (for React hooks correctness)
- `eslint-plugin-react-refresh` (for HMR safety)

**No changes needed to ESLint config for testing.** Vitest provides its own ESLint plugin (`eslint-plugin-vitest`) if desired, but it's optional.

### 5.4 Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",

    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest",
    "test:integration": "vitest run --project integration",
    "typecheck": "tsc -b --noEmit"
  }
}
```

---

## 6. Test File Templates

### 6.1 Pure Function Test

```typescript
// src/lib/__tests__/utils.test.ts
import { cn, formatDate } from '@/lib/utils'

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra')
  })

  it('resolves Tailwind conflicts', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })
})
```

### 6.2 API Wrapper Test (with MSW)

```typescript
// src/lib/__tests__/ai.test.ts
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/node'
import { categorizeItem, enrichProduct } from '@/lib/ai'

describe('categorizeItem()', () => {
  it('returns category and storage area for a product name', async () => {
    const result = await categorizeItem('Mælk')

    expect(result).toEqual({
      category: 'Mejeri',
      storageArea: 'Køleskab',
    })
  })

  it('throws when API returns 503', async () => {
    server.use(
      http.post('https://ai.api.nvidia.com/v1/*', () => {
        return new HttpResponse(null, { status: 503 })
      }),
    )

    await expect(categorizeItem('Mælk')).rejects.toThrow()
  })

  it('throws when API returns invalid JSON', async () => {
    server.use(
      http.post('https://ai.api.nvidia.com/v1/*', () => {
        return HttpResponse.text('not-json', { status: 200 })
      }),
    )

    await expect(categorizeItem('Mælk')).rejects.toThrow()
  })
})
```

### 6.3 Hook Test (with mocked Firestore)

```typescript
// src/hooks/__tests__/useLists.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const mockUnsubscribe = vi.fn()
const mockOnSnapshot = vi.fn(() => mockUnsubscribe)

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => 'lists'),
  query: vi.fn(() => 'query'),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'user-1' }, loading: false }),
}))

import { useLists } from '@/hooks/useLists'

describe('useLists()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading state initially', () => {
    mockOnSnapshot.mockImplementation((_q, onNext) => {
      // Don't call onNext yet — simulate loading
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useLists())

    expect(result.current.loading).toBe(true)
    expect(result.current.lists).toEqual([])
  })

  it('returns lists when data arrives', async () => {
    mockOnSnapshot.mockImplementation((_q, onNext) => {
      onNext({
        docs: [
          {
            id: 'list-1',
            data: () => ({ name: 'Indkøb', ownerId: 'user-1' }),
          },
        ],
      })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useLists())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.lists).toHaveLength(1)
    expect(result.current.lists[0].name).toBe('Indkøb')
  })

  it('returns error state when snapshot fails', async () => {
    mockOnSnapshot.mockImplementation((_q, _onNext, onError) => {
      onError(new Error('Permission denied'))
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useLists())

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
  })

  it('cleans up subscription on unmount', () => {
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe)

    const { unmount } = renderHook(() => useLists())
    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
```

### 6.4 Component Test (with MSW + Router)

```typescript
// src/components/__tests__/ListCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ListCard } from '@/components/ListCard'

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key === 'lists.members' ? '{count} medlemmer' : key,
  }),
}))

describe('ListCard', () => {
  const list = {
    id: 'list-1',
    name: 'Indkøb',
    ownerId: 'user-1',
    memberCount: 3,
    itemCount: 12,
  }

  const renderWithRouter = (ui: React.ReactElement) =>
    render(<BrowserRouter>{ui}</BrowserRouter>)

  it('renders list name', () => {
    renderWithRouter(<ListCard list={list} />)
    expect(screen.getByText('Indkøb')).toBeInTheDocument()
  })

  it('shows member count', () => {
    renderWithRouter(<ListCard list={list} />)
    expect(screen.getByText(/3 medlemmer/)).toBeInTheDocument()
  })

  it('links to list detail page', () => {
    renderWithRouter(<ListCard list={list} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/lists/list-1')
  })

  it('renders item count indicator', () => {
    renderWithRouter(<ListCard list={list} />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})
```

---

## 7. Performance Considerations

### 7.1 Test Execution Speed

| Test Type | Count (est.) | Time (est.) | CI Time |
|-----------|-------------|-------------|---------|
| Pure function unit | 15-20 | <1s | <1s |
| API wrapper (MSW) | 10-15 | ~2s | ~2s |
| Hook integration (mocked) | 20-30 | ~3s | ~3s |
| Component tests | 30-40 | ~5s | ~5s |
| **Total (unit + component)** | **~100 tests** | **~10s** | **~10s** |
| Firebase emulator integration | 10-15 | ~15s (inc. emulator boot) | ~30s (with cache) |

### 7.2 Optimization Strategies

1. **Parallel test execution**: Vitest runs test files in parallel by default. Use `pool: 'forks'` (recommended for jsdom) with `singleFork: false`.

2. **Selective test execution in CI**: Run unit + component tests on every push. Run emulator integration tests only on PRs to main (or on a schedule).

3. **Watch mode for development**: `vitest` (no `run` flag) starts in watch mode, rerunning only changed tests — sub-100ms for most changes.

4. **MSW + Vitest compatibility**: MSW v2 works seamlessly with Vitest via `@mswjs/interceptors`. No `cross-fetch` polyfill needed with Node 22+ (native `fetch` is available).

---

## 8. Phase-Specific Architecture Recommendations

### Phase 1 (This Week — Deploy First)

**Objective:** Get CI/CD running + critical tests. Deploy to Vercel.

1. Install Vitest + Testing Library + MSW
2. Write tests for: `ai.ts`, `barcode.ts`, `utils.ts`
3. Set up GitHub Actions: lint → typecheck → test → build → deploy
4. Configure Vercel project and secrets
5. Deploy to production

**Don't do yet:** Firebase emulator, E2E tests, component tests.

### Phase 2 (Soon After)

**Objective:** Medium coverage on hooks + components.

1. Add hook tests for `useLists`, `useAuth` (with mocked Firestore)
2. Add component tests for critical UI (ListCard, PantryItem)
3. Set up coverage thresholds
4. Tighten ESLint to `--max-warnings 0`

### Phase 3 (Later)

**Objective:** High-fidelity integration and E2E.

1. Set up Firebase emulator in CI
2. Add Firestore integration tests (security rules, read/write patterns)
3. Evaluate whether E2E is needed (Playwright or Cypress)
4. Add visual regression testing if UI becomes complex

---

## 9. Sources

| Topic | Source | Confidence |
|-------|--------|------------|
| Vitest 4 config + Vite 8 compat | vitest.dev, GitHub issue #9587, Supabase PR #44833 | HIGH |
| React Testing Library + React 19 | GitHub releases v16.1.0, DepFixer | HIGH |
| MSW + Vitest integration | vitest.dev/guide/mocking/requests, mswjs.io | HIGH |
| Firebase emulator + Vitest known issues | GitHub issues #8137, #6905 | HIGH |
| Vercel deploy via GitHub Actions | vercel.com/kb (official guide) | HIGH |
| TypeScript 6.0 breaking changes | Microsoft DevBlogs | HIGH |
| Firestore mock patterns (module vs emulator) | `@firebase/rules-unit-testing` docs, community articles | MEDIUM |
| Vitest config with jsdom + node workspace | vitest.dev/config | HIGH |
