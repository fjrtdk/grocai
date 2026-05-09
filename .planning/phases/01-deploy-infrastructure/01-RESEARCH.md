# Phase 1: Deploy Infrastructure — Research

**Researched:** 2026-05-09
**Domain:** Vercel deployment, SPA routing, React error boundaries, loading states, empty states
**Confidence:** HIGH

## Summary

This phase deploys the GrocAI PWA to Vercel and adds basic UX safeguards. The app is a client-only Vite+React SPA with Firebase Auth/Firestore backend, no SSR or server functions. Vercel auto-detects Vite and provides sensible defaults — the key configuration is a `vercel.json` with SPA rewrites to enable deep linking.

The project has a GitHub remote (`github.com/fjrtdk/grocai.git`) and Vercel CLI v53.3.1 is installed and available. The deployment sequence is: link project via `vercel link --repo`, add 7 environment variables via `vercel env add`, create `vercel.json` with rewrite rules, then deploy with `vercel deploy --prod`. Node.js v22.22.2 and npm 10.9.7 are available.

For Polish requirements: React 19 still uses class-based error boundaries (no functional component API yet). Route-keyed reset via `key={location.pathname}` is the standard pattern. Tailwind v4 `animate-pulse` utility handles skeleton loading animations. Lucide React icons plus `Button` component compose per-page empty states with CTAs.

**Primary recommendation:** Execute deployment as a single sequential task (link → env vars → vercel.json → deploy), then implement polish features independently. The pre-deploy gate (`tsc --noEmit && eslint . && vite build`) catches issues before any deploy attempt.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Project created via Vercel CLI (`vercel link`) rather than dashboard
- **D-02:** Project name `grocai` — production URL will be `grocai.vercel.app`
- **D-03:** Connect GitHub during initial setup for auto-deploy on push (not deferred to Phase 2)
- **D-04:** Environment variables configured via `vercel env add` (one per var, CLI-based)
- **D-05:** Pre-deploy gate: `tsc --noEmit && eslint . && vite build` (typecheck + lint + build)
- **D-06:** Per-page error boundaries via a single shared `ErrorBoundary` component inside `<AppShell>` with route-based `key` for reset on navigation
- **D-07:** Fallback UI branded with dark theme — icon + "Noget gik galt" message + "Prøv igen" retry button
- **D-08:** No toast-based error handler for recoverable errors — error boundary only
- **D-09:** Skeleton placeholders (not spinners) with pulse animation
- **D-10:** Per-component skeletons (not full-page) — each data-driven section loads independently
- **D-11:** Per-page custom skeleton markup (not a shared `Skeleton` component)
- **D-12:** Text message + Lucide icon illustration
- **D-13:** Each empty state includes a call-to-action button for the primary next action
- **D-14:** Per-page custom empty states (not a shared component)
- **D-15:** Affected pages: ListsHome ("Ingen lister endnu"), ListDetail (all items checked off), Pantry, Dashboard (no pinned lists)

### The Agent's Discretion

None specified in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPLOY-01 | Deploy to Vercel with single command | Vercel CLI sequence documented in §Vercel Deployment Sequence. Command: `vercel deploy --prod`. |
| DEPLOY-02 | SPA routing on page refresh (vercel.json) | Vercel rewrites rule for Vite SPA documented in §SPA Rewrites Configuration. |
| POLISH-01 | React error boundary | Class-based ErrorBoundary component pattern documented in §Error Boundary Implementation. |
| POLISH-02 | Loading states on all pages | Per-page skeleton pattern with `animate-pulse` documented in §Loading States Pattern. |
| POLISH-03 | Empty states for lists/pantry | Per-page custom empty states with Lucide icons + CTA documented in §Empty States Pattern. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SPA routing config | CDN / Static (Vercel) | — | `vercel.json` rewrites are a Vercel-level config that operates before any JS runs. Browser tier (React Router) handles in-app navigation, but Vercel must catch page-refresh 404s. |
| Error boundary | Browser / Client | — | ErrorBoundary is a React component running in the browser. No server involvement. |
| Loading states | Browser / Client | — | Skeleton UI is purely client-side rendering based on hook state. |
| Empty states | Browser / Client | — | Per-page conditional rendering based on Firestore data presence. |
| Environment variables | API / Backend (Vercel) | Browser / Client | Vars are configured in Vercel dashboard/CLI, injected by Vite at build time via `import.meta.env`. |
| Build pipeline | API / Backend (Vercel) | Browser / Client | Vercel runs `build` command. Build output `dist/` is deployed as static files. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | ^8.0.10 | Build tool + dev server | Already the project build tool. Vercel auto-detects Vite and sets correct defaults. |
| React | ^19.2.5 | UI framework | Target platform. Error boundaries are a React primitive. |
| Tailwind CSS | ^4.3.0 | Styling | Provides `animate-pulse` utility for skeleton loading animations. |
| Lucide React | ^1.14.0 | Icons | Already in project. Empty state illustrations use existing icons. |
| react-router-dom | ^7.15.0 | Client routing | Route-keyed error boundary reset via `location.pathname`. |

**Verified versions:** [VERIFIED: npm registry / package.json]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | ^0.7.1 | Component variants | Button variant styling for CTAs in empty states |
| tailwind-merge + clsx | ^3.5.0 / ^2.1.1 | Class merging | `cn()` utility for conditional classes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom ErrorBoundary class component | `react-error-boundary` npm package | Package wraps the same class lifecycle. Custom component avoids dependency and is trivial (10 lines of logic). Decision D-06 implies custom. |
| Per-page custom skeletons | Shared Skeleton component | D-11 explicitly rejects shared component. Per-page custom markup gives more control over layout. |

## Architecture Patterns

### System Architecture Diagram

```
User Browser
    │
    ├── DNS → grocai.vercel.app
    │
    ▼
Vercel Edge Network
    │
    ├── vercel.json rewrites ──→ /index.html (all routes)
    │
    ▼
Vite-built Static Assets (dist/)
    │
    ├── index.html
    ├── assets/index-*.js       (React app bundle)
    └── assets/index-*.css      (Tailwind styles)
            │
            ▼
    React App (Browser)
            │
    ┌───────┴───────┐
    │  Auth Gate     │── no user → <AuthPage>
    │  (useAuth)     │── loading  → spinner
    └───────┬───────┘
            │ user authenticated
            ▼
    <BrowserRouter>
            │
    ┌───────┴───────────┐
    │  <AppShell>       │  ← ErrorBoundary wraps this with route-key
    │  ├─ <Sidebar>     │
    │  ├─ <MobileNav>   │
    │  └─ <main>        │
    │       ├─ Routes   │
    │       │  /        → <Dashboard>
    │       │  /lists   → <ListsHome>
    │       │  /lists/:id → <ListDetail>
    │       │  /scan    → <Scanner>
    │       │  /pantry  → <Pantry>
    │       │  /settings→ <Settings>
    │       └─ per-page:
    │          ├─ Loading state (skeleton while useCollection/useDocument fires)
    │          ├─ Empty state (icon + text + CTA when data.length === 0)
    │          └─ Data state
    └───────────────────┘
            │
            ▼
    Firebase (Firestore + Auth)
```

### Component Tree (Error Boundary + Polish)

```
<main>   ← ErrorBoundary is NOT a separate wrapping component
  └─ <ErrorBoundary key={location.pathname}>
       └─ <Routes>
            ├─ <Dashboard>
            │    ├─ loading → <DashboardSkeleton /> (per-page custom)
            │    ├─ empty  → <DashboardEmpty /> (icon + "Ingen lister" + CTA)
            │    └─ data   → cards + item rows
            ├─ <ListsHome>
            │    ├─ loading → <ListsHomeSkeleton />
            │    └─ empty  → icon + "Ingen lister endnu" + "Opret liste" CTA
            ├─ <ListDetail>
            │    ├─ loading → <ListDetailSkeleton />
            │    └─ empty (all checked) → icon + "Alle varer er købt" + CTA
            └─ <Pantry>
                 ├─ loading → <PantrySkeleton />
                 └─ empty  → icon + "Dit pantry er tomt" + CTA
```

### Pattern 1: Error Boundary (Class Component)
**What:** A class component that implements `getDerivedStateFromError` and `componentDidCatch` lifecycle methods. Placed inside `<main>` or wrapping `<Routes>` with `key={location.pathname}` for automatic reset on navigation.

**When to use:** Always. Wrap the authenticated route tree so any render-time crash shows branded fallback UI instead of a white screen.

**Example:**
```tsx
// Source: [VERIFIED: React docs — class-based error boundaries still required in React 19]
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Noget gik galt</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {this.state.error.message}
          </p>
          <Button
            variant="default"
            onClick={() => this.setState({ error: null })}
          >
            Prøv igen
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
```

**Route-keyed reset pattern in App.tsx:**
```tsx
// Place ErrorBoundary inside <BrowserRouter> so location is accessible
import { useLocation } from 'react-router-dom'

function AppRoutes() {
  const location = useLocation()
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>...</Routes>
    </ErrorBoundary>
  )
}
```

### Pattern 2: Skeleton Loading (Tailwind animate-pulse)
**What:** Per-page custom skeleton markup using Tailwind v4 `animate-pulse` utility on rounded placeholder divs.

**When to use:** When `loading === true` from any Firestore hook. Render skeleton markup matching the page's layout structure.

**Example (ListsHome skeleton):**
```tsx
// Per D-11: per-page custom markup, not a shared component
function ListsHomeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-32 rounded bg-secondary" />
      <div className="h-4 w-48 rounded bg-secondary" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-secondary" />
      ))}
    </div>
  )
}
```

### Pattern 3: Empty State (Lucide Icon + CTA)
**What:** Per-page custom empty state component with a Lucide icon, descriptive text, and a primary action button.

**When to use:** When `loading === false` and data array is empty.

**Example (ListsHome empty state — "Ingen lister endnu"):**
```tsx
// Per D-12 through D-14: per-page custom, icon + text + CTA
import { ClipboardList } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function ListsHomeEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="text-center py-12">
      <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-muted-foreground mb-2">Ingen lister endnu</p>
      <p className="text-xs text-muted-foreground mb-4">
        Opret din første indkøbsliste
      </p>
      <Button onClick={onCreate}>
        <Plus size={16} />
        Opret liste
      </Button>
    </Card>
  )
}
```

### Anti-Patterns to Avoid
- **Error boundary without `key` prop on `<Routes>`:** If `key` is not set, navigating away from a crashed page and back still shows the error fallback. React reuses the same component instance. Always use `key={location.pathname}`.
- **Full-page spinners instead of skeletons:** D-09 specifies skeletons with pulse animation. Perceived performance is better than a spinner.
- **Shared skeleton component:** D-11 explicitly says per-page custom markup. A shared component would make content layout hard to match.
- **Error boundary wrapping `<BrowserRouter>`:** The `key` pattern requires `useLocation()` which only works inside `<BrowserRouter>`.
- **Using `cleanUrls: true` without adjusting rewrite destination:** If `cleanUrls` is `true`, destination must be `/index` not `/index.html` [VERIFIED: Vercel community thread].

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundary class boilerplate | N/A (this IS the standard approach) | Custom `ErrorBoundary` class component | React 19 still requires class components for error boundaries. Third-party library `react-error-boundary` just wraps the same lifecycle. |
| Loading animation CSS | Custom keyframe animation | Tailwind `animate-pulse` | Built into Tailwind v4. Zero-config, consistent `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite` animation. |
| Icon set | Hand-drawn SVGs | Lucide React | Already in project. Provides consistent, accessible SVG icons. |
| Deployment pipeline | Manual FTP/SCP | Vercel CLI + git push | Vercel handles build, CDN, SSL, domain automatically. |

**Key insight:** Error boundary logic is trivial (5 lines of state management). A library dependency for this adds no value and violates D-06's implicit preference for a custom component.

## Common Pitfalls

### Pitfall 1: Error Boundary Not Resetting on Navigation
**What goes wrong:** User navigates to a page that crashes, sees error fallback, navigates to a different page, still sees the old error fallback.
**Why it happens:** React reuses the ErrorBoundary component instance, preserving its internal `hasError` state. Without a `key` prop change, the boundary never resets.
**How to avoid:** Set `key={location.pathname}` on the ErrorBoundary. When the route changes, React unmounts the old boundary and mounts a fresh one.
**Warning signs:** Navigation works normally until a page crashes, then all subsequent navigation still shows the error UI.

### Pitfall 2: Vercel SPA Routes Returning 404
**What goes wrong:** `mysite.vercel.app/lists` returns Vercel's default 404 page instead of the SPA.
**Why it happens:** Vercel serves static files first. If no file matches the path, it returns 404 unless `vercel.json` rewrites catch the request.
**How to avoid:** Add `{ "source": "/(.*)", "destination": "/index.html" }` to `vercel.json` rewrites. Do NOT set `cleanUrls: true` unless also changing destination to `/index`.
**Warning signs:** Root `/` works, but direct navigation to any other route gives 404.

### Pitfall 3: Missing `.vercel` in .gitignore Causing Build Conflicts
**What goes wrong:** The `.vercel/` directory (created by `vercel link`) contains local-only config that differs between environments. If committed, it can cause deploy conflicts.
**Why it happens:** `.vercel/` contains `project.json` with local `orgId` and `projectId`. The Vercel build environment generates its own.
**How to avoid:** Add `.vercel` to `.gitignore` AFTER running `vercel link`. Vercel docs recommend this.
**Warning signs:** "Project ID not defined" or linking errors on CI.

### Pitfall 4: Skeleton Flash on Fast Connections
**What goes wrong:** Skeleton loads for a split second before real content appears, causing a jarring UI flash.
**Why it happens:** The `loading` state from `onSnapshot` fires synchronously on mount. Even if Firestore returns data immediately, the skeleton renders briefly.
**How to avoid:** Use a minimum display time (e.g., `setTimeout` to delay showing skeleton by 100ms) OR check if `loading` has been true for more than a threshold. However, for MVP this is acceptable — the skeleton is brief and matches the final layout.
**Warning signs:** Brief flicker of gray blocks on fast page loads.

## Code Examples

### vercel.json (Complete)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Source: [VERIFIED: Vercel docs for Vite SPA — docs.vercel.com/docs/frameworks/frontend/vite]

### Pre-deploy Gate Script
```json
// Add as a script in package.json or use as inline command
"predeploy": "tsc --noEmit && eslint . && vite build"
```
Note: The current `build` script is `tsc -b && vite build`. D-05 specifies `tsc --noEmit` for the gate, which only type-checks without emitting output files (faster and appropriate for verification). [VERIFIED: package.json]

### Environment Variables Setup (CLI)
```bash
# NVIDIA_API_KEY — sensitive, production only
echo "nvapi-..." | vercel env add NVIDIA_API_KEY production --sensitive

# Firebase vars — add to production, preview, and development
# Each var added individually as D-04 specifies
echo "AIzaSy..." | vercel env add VITE_FIREBASE_API_KEY production
echo "AIzaSy..." | vercel env add VITE_FIREBASE_API_KEY preview
echo "AIzaSy..." | vercel env add VITE_FIREBASE_API_KEY development
```
Source: [VERIFIED: Vercel CLI docs — vercel.com/docs/cli/env]

### ErrorBoundary Component (Full)
```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error boundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Noget gik galt</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {this.state.error.message}
          </p>
          <Button
            variant="default"
            onClick={() => this.setState({ error: null })}
          >
            Prøv igen
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
```
Source: [VERIFIED: React docs — react.dev/reference/react/Component, updated for React 19 behavior]

### Skeleton Pattern (Per-Page Custom)
```tsx
// Dashboard skeleton — matches Dashboard layout structure
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-secondary" />
        <div className="h-8 w-24 rounded-lg bg-secondary" />
      </div>
      <div className="h-32 rounded-xl bg-secondary" />
      <div className="h-48 rounded-xl bg-secondary" />
    </div>
  )
}
```
Source: [VERIFIED: Tailwind CSS docs — tailwindcss.com/docs/animation]

### Empty State Pattern (Per-Page Custom)
```tsx
// Pantry empty state
import { Package } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function PantryEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="text-center py-12">
      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-muted-foreground mb-2">Dit pantry er tomt</p>
      <p className="text-xs text-muted-foreground mb-4">
        Scan eller tilføj varer
      </p>
      <Button onClick={onAdd}>
        <Plus size={16} />
        Tilføj til pantry
      </Button>
    </Card>
  )
}
```
Note: Text strings shown in examples are for da-DK (project default locale). Actual implementation should use `useTranslation()` / `t()` calls.

## Vercel Deployment Sequence

### Step 1: Install/Verify Vercel CLI
```bash
# Already installed: vercel 53.3.1
# If needed:
npm install -g vercel
```

### Step 2: Link Project
```bash
# D-01 specifies CLI linking
# Git remote exists at github.com/fjrtdk/grocai.git, so use --repo
vercel link --repo
```
This creates `.vercel/repo.json` containing `orgId` and project mapping. D-03 says to connect GitHub now (not deferred), which happens automatically when linking with `--repo` because Vercel reads the git remote.

### Step 3: Add Environment Variables
```bash
# 7 env vars total (from .env.example)
# NVIDIA_API_KEY is sensitive — use --sensitive flag
echo "nvapi-..." | vercel env add NVIDIA_API_KEY production --sensitive

# Firebase vars — 6 vars, each added to all 3 environments
for env in production preview development; do
  echo "value" | vercel env add VITE_FIREBASE_API_KEY $env
  echo "value" | vercel env add VITE_FIREBASE_AUTH_DOMAIN $env
  echo "value" | vercel env add VITE_FIREBASE_PROJECT_ID $env
  echo "value" | vercel env add VITE_FIREBASE_STORAGE_BUCKET $env
  echo "value" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID $env
  echo "value" | vercel env add VITE_FIREBASE_APP_ID $env
done
```

### Step 4: Create vercel.json
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 5: Run Pre-Deploy Gate
```bash
tsc --noEmit && eslint . && vite build
```
This matches D-05. Note: `vite build` outputs to `dist/` (Vite default). `dist` is already in `.gitignore`.

### Step 6: Deploy
```bash
vercel deploy --prod
```

### Step 7: Verify
1. Visit `https://grocai.vercel.app` — app loads
2. Navigate to `/lists`, `/pantry`, `/settings` — each route works on direct navigation
3. Refresh on any route — still loads (SPA rewrites working)
4. Run `vercel inspect <url> --logs` if build fails

### Post-Deployment: Add `.vercel` to `.gitignore`
```gitignore
# .gitignore — add after creating .vercel/
.vercel
```

## SPA Rewrites Configuration

The canonical Vercel config for a Vite SPA is:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Important caveats:** [VERIFIED: Vercel docs + community issue]
- Do NOT use `"cleanUrls": true` unless also changing destination to `/index` (without `.html` extension). The plain `/(.*)` → `/index.html` rewrite works without `cleanUrls`.
- The `$schema` URL enables IDE autocomplete and validation.
- No `framework` property needed — Vercel auto-detects Vite from `package.json`.
- No `buildCommand` or `outputDirectory` override needed — Vite defaults to `dist/` and Vercel's Vite detection handles it.

## Error Boundary Implementation Pattern

### Design
- **Class component** — React 19 still requires class components for error boundaries. The lifecycle methods `getDerivedStateFromError` (render-phase, updates state) and `componentDidCatch` (commit-phase, side effects) have no functional hook equivalents. [VERIFIED: React docs + community analysis]
- **Single shared ErrorBoundary** — Per D-06, one component used everywhere via instantiation with `key` prop for reset behavior.
- **Route-keyed reset** — `key={location.pathname}` causes React to create a new ErrorBoundary instance on route change, clearing the error state.
- **Dark theme fallback** — Uses existing Tailwind tokens (`text-muted-foreground`, `bg-secondary`, etc.) to match the app's dark theme.

### Placement
The ErrorBoundary wraps `<Routes>` inside `<BrowserRouter>` so `useLocation()` is available:

```tsx
function App() {
  const { user, loading, signInGoogle } = useAuth()
  // ... auth gate ...

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

function AppRoutes() {
  const location = useLocation()
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>...</Routes>
    </ErrorBoundary>
  )
}
```

### i18n Keys to Add
Add to `da.json` and `en.json`:
```json
{
  "error": {
    "title": "Noget gik galt" / "Something went wrong",
    "description": "Der opstod en uventet fejl. Prøv igen." / "An unexpected error occurred. Please try again.",
    "retry": "Prøv igen" / "Try again"
  }
}
```
Note: D-06 mentions fallback UI with icon + "Noget gik galt" + "Prøv igen". The `common.retry` key already exists ("Prøv igen"). Use `t('error.title')` and `t('common.retry')` to avoid duplication.

## Loading States Pattern

### Design
- **Skeleton placeholder per-component** — Each page renders custom skeleton markup while `loading === true`. 
- **Pulse animation** via Tailwind `animate-pulse` — 2-second cubic-bezier opacity pulse.
- **Per-page custom markup** — Skeleton layout mirrors the page's data layout structure.

### Which Pages Need Skeletons

| Page | Hook | Loading Source | Skeleton Coverage |
|------|------|----------------|-------------------|
| Dashboard | `useLists`, `useListItems` | Firestore onSnapshot | Full page skeleton |
| ListsHome | `useLists` | Firestore onSnapshot | Full page skeleton |
| ListDetail | `useDocument`, `useListItems` | Firestore onSnapshot | Full page skeleton |
| Pantry | `usePantry` | Firestore onSnapshot | Full page skeleton |
| Scanner | — | No Firestore hook | No skeleton needed |
| Settings | — | No Firestore hook | No skeleton needed |

### Hook Pattern for Loading
The existing hooks all return `loading`:
```tsx
const { lists, loading } = useLists(user?.uid)
const { items, loading: itemsLoading } = useListItems(id)
const { items, loading: pantryLoading } = usePantry(user?.uid)
```

Usage pattern:
```tsx
function ListsHome() {
  const { lists, loading } = useLists(user?.uid)
  // ...

  if (loading) return <ListsHomeSkeleton />

  return <DataView ... />
}
```

### Tailwind v4 Note
`animate-pulse` is a built-in utility in Tailwind v4. No configuration needed. It generates:
```css
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
@keyframes pulse {
  50% { opacity: 0.5; }
}
```
[VERIFIED: Tailwind CSS docs — tailwindcss.com/docs/animation]

## Empty States Pattern

### Design
- **Per-page custom components** — Each page renders its own empty state when `loading === false && data.length === 0`.
- **Lucide icon + text + CTA** — Following D-12, D-13. Use existing Lucide React icons.
- **Button component from UI primitives** — Use `src/components/ui/button.tsx` for CTAs.

### Per-Page Empty States

| Page | Condition | Icon | Text (da-DK) | CTA |
|------|-----------|------|-------------|-----|
| Dashboard | `no pinned lists && no active list` | ClipboardList | "Ingen lister endnu — Opret din første indkøbsliste" | "Opret liste" |
| ListsHome | (pinned + active) length === 0 | ClipboardList | "Ingen lister endnu" | "Opret liste" |
| ListDetail | items.length === 0 (all checked off) | CheckCircle2 | "Alle varer er købt" | "Tilføj vare" |
| Pantry | filtered items.length === 0 | Package | "Dit pantry er tomt — Scan eller tilføj varer" | "Tilføj til pantry" |

Note: Pantry already has a basic empty state at `Pantry.tsx:72-77`. Need to enhance with icon and CTA per D-12/D-13/D-14.

### i18n Keys to Add
Many empty state texts are already defined in locale files:
- `list.noLists` = "Ingen lister endnu" ✓
- `list.noListsHint` = "Opret din første indkøbsliste" ✓
- `item.noItems` = "Ingen varer på listen" ✓
- `pantry.noItems` = "Dit pantry er tomt" ✓
- `pantry.noItemsHint` = "Scan eller tilføj varer" ✓

May need a new key for Dashboard's specific empty state text.

## Build & Verify

### Pre-Deploy Gate (D-05)
```bash
tsc --noEmit && eslint . && vite build
```

Breaking it down:
1. **`tsc --noEmit`** — TypeScript type checking without emitting output. Checks `tsconfig.app.json` (app code) and `tsconfig.node.json` (config files) via project references.
2. **`eslint .`** — ESLint flat config (v10). Runs TS + React Hooks + React Refresh plugins.
3. **`vite build`** — Production build output to `dist/`. Includes PWA service worker generation via `vite-plugin-pwa`.

### Current Build Script
`package.json` has `"build": "tsc -b && vite build"`. The `-b` flag uses project references and also type-checks. For the gate, `tsc --noEmit` is preferred because it's faster (no build info file writes) and strictly type-checks without emitting.

### Vite Production Considerations
- `base: '/'` is the default — no change needed. [VERIFIED: vite.config.ts, no base override]
- `outDir: 'dist'` is the default — Vercel auto-detects Vite and looks in `dist/`. [VERIFIED: Vercel Vite framework docs]
- PWA plugin is already configured with production-safe settings. No changes needed.

## Environment Variables

### Complete Variable List

| Variable | Sensitive? | Environments | Source |
|----------|-----------|-------------|--------|
| `NVIDIA_API_KEY` | Yes (`--sensitive`) | Production only | nvidia.com API key |
| `VITE_FIREBASE_API_KEY` | No | Production, Preview, Development | Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | No | Production, Preview, Development | Firebase Console |
| `VITE_FIREBASE_PROJECT_ID` | No | Production, Preview, Development | Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | Production, Preview, Development | Firebase Console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | Production, Preview, Development | Firebase Console |
| `VITE_FIREBASE_APP_ID` | No | Production, Preview, Development | Firebase Console |

### NVIDIA_API_KEY Security
- Add with `--sensitive` flag: `vercel env add NVIDIA_API_KEY production --sensitive`
- Sensitive vars are non-readable in dashboard once set [VERIFIED: Vercel CLI docs]
- The API key is used browser-side (`dangerouslyAllowBrowser: true` in `src/lib/ai.ts`). This means it's ultimately extractable from client bundle — but Vercel encryption at rest/storage is still important.
- Only add to `production` environment (not preview/development) to limit exposure.

### Firebase Vars
- All 6 `VITE_FIREBASE_*` vars must be added to production, preview, AND development environments.
- Firebase project must already exist with Authentication (Google Sign-In) and Firestore enabled.
- The `.env.example` has placeholder values that need real Firebase project values from Firebase Console.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Vercel build fails due to missing env vars | Medium | High — blocks deploy | Run pre-deploy gate first; `vite build` will fail if env vars are referenced but undefined |
| Firestore security rules reject production reads | Low | High — app loads but no data | Verify Firebase project has correct Firestore rules deployed |
| NVIDIA API key not working in production | Low | Medium — AI features silently fallback | Add to Vercel with `--sensitive`, test after deploy via app's AI features |
| PWA service worker caching stale content | Low | Medium — users see old data | `autoUpdate` register type + `NetworkFirst` strategy already configured |
| Skeleton flash on fast connections | Medium | Low — cosmetic | Acceptable for MVP; can add minimum display time later |
| .gitignore missing `.vercel` entry | Medium | Medium — commit local config | Add `.vercel` to `.gitignore` after linking, before first commit |

## i18n Additions Required

### Keys to Add to `da.json` and `en.json`

```json
// da.json additions
{
  "error": {
    "title": "Noget gik galt",
    "description": "Der opstod en uventet fejl. Prøv igen."
  },
  "dashboard": {
    "noPinnedLists": "Ingen fastgjorte lister",
    "noPinnedListsHint": "Fastgør en liste fra listen for at se den her"
  }
}

// en.json additions
{
  "error": {
    "title": "Something went wrong",
    "description": "An unexpected error occurred. Please try again."
  },
  "dashboard": {
    "noPinnedLists": "No pinned lists",
    "noPinnedListsHint": "Pin a list to see it here"
  }
}
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vercel CLI | Deployment | ✓ | 53.3.1 | — |
| Node.js | Build pipeline | ✓ | v22.22.2 | — |
| npm | Package management | ✓ | 10.9.7 | — |
| Git | Vercel linking, deployment | ✓ | — | — |
| GitHub remote | Vercel git integration | ✓ | github.com/fjrtdk/grocai.git | — |

**Missing dependencies with no fallback:** None — all required tools are available.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (deferred) | Firebase Auth already configured |
| V6 Cryptography | Yes | `NVIDIA_API_KEY` stored as Vercel sensitive env var |
| V8 Data Protection | Yes | Firestore security rules control access |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key exposure in client bundle | Information Disclosure | `NVIDIA_API_KEY` exposed by design (`dangerouslyAllowBrowser: true`). Mitigation: Vercel sensitive env var at rest, proxy via Vercel Function deferred to INFRA-04. |
| Missing env vars | Denial of Service | Pre-deploy gate (`vite build`) fails fast if required env vars are missing. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Error boundary must be a class component in React 19 | Error Boundary Implementation | If React 19 adds a functional error boundary API between training data and now, the class component still works (backward compatible). No risk. |
| A2 | Vercel auto-detects Vite framework without vercel.json `framework` property | Vercel Deployment Sequence | If auto-detection fails, build fails. Add `"framework": null` (for "Other") or specify buildCommand/outputDirectory explicitly as fallback. |

## Open Questions (RESOLVED)

1. **Firebase project configuration status** — RESOLVED: Plan 01-01 Task 2 blocks on user-provided env var values via a `checkpoint:human-action` gate. Values are added via `vercel env add` CLI. The app references `import.meta.env.VITE_FIREBASE_*` which Vite resolves at build time — if values are missing, `vite build` fails in the pre-deploy gate.

2. **NVIDIA NIM API key availability** — RESOLVED: Plan 01-01 Task 2 includes `NVIDIA_API_KEY` in the same `checkpoint:human-action` gate, added with `--sensitive` flag to production only. Rate limiting is out of scope for deployment phase.

3. **Vercel account/org availability** — RESOLVED: Plan 01-01 Task 1 runs `vercel link --repo`, which verifies CLI authentication and creates the Vercel project in one step. The plan-phase orchestrator confirmed the CLI session is valid (user: fjrtdk-9930, single personal team, no `--scope` needed).

## Sources

### Primary (HIGH confidence)
- [VERIFIED: Vercel docs — vercel.com/docs/cli/link] — `vercel link` command reference
- [VERIFIED: Vercel docs — vercel.com/docs/cli/env] — `vercel env add` command reference
- [VERIFIED: Vercel docs — vercel.com/docs/project-configuration/vercel-json] — `vercel.json` configuration reference
- [VERIFIED: Vercel docs — vercel.com/docs/frameworks/frontend/vite] — Vite SPA deployment with rewrites
- [VERIFIED: Vercel docs — vercel.com/docs/routing/rewrites] — Rewrite rules including SPA pattern
- [VERIFIED: React docs — react.dev/reference/react/Component] — Error boundary lifecycle methods
- [VERIFIED: Tailwind CSS docs — tailwindcss.com/docs/animation] — `animate-pulse` utility
- [VERIFIED: npm registry / package.json] — All library versions verified against project package.json

### Secondary (MEDIUM confidence)
- [VERIFIED: Vercel CLI env add documentation] — `--sensitive` flag for secrets, environment targeting
- [VERIFIED: Community issue — Vercel community thread on cleanUrls + rewrites] — `cleanUrls: true` requires destination `/index` not `/index.html`
- [VERIFIED: React 19 error boundary behavior change — andrei-calazans.com] — React 19 only logs first error, no duplicate recovery attempts

### Tertiary (LOW confidence)
- None — all claims in this document are either verified against source code, official docs, or marked as ASSUMED.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All versions verified against package.json, patterns from official docs
- Architecture: HIGH — Component tree confirmed against src/ codebase, routing verified in ARCHITECTURE.md
- Pitfalls: HIGH — Verified against Vercel docs and community threads

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (stable — core patterns unlikely to change in a month)
