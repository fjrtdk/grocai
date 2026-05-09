# Stack — GrocAI

## Languages & Runtime

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | ~6.0.2 |
| Runtime | Browser (PWA) | — |
| Build | Vite | ^8.0.10 |
| Package Manager | npm | — |

## Frontend Framework

- **React** ^19.2.5 with JSX transform (`react-jsx`)
- **React Router DOM** ^7.15.0 for client-side routing
- **Zustand** ^5.0.13 for state management (declared but not yet used in source)

## Styling

- **Tailwind CSS** v4 (^4.3.0) via `@tailwindcss/vite` plugin
- Dark theme with OKLCH color tokens (`--color-background: oklch(0 0 0)`)
- Vercel-inspired dark palette defined in `src/index.css:3-37`
- Utility classes: `scrollbar-none` custom utility in `src/index.css:60-68`

## UI Component Library

- **Custom primitives** (shadcn-style, no CLI dependency) in `src/components/ui/`
- 7 components: Button, Card, Input, Badge, Checkbox, Dialog, Sheet, Avatar
- **Radix UI** primitives (declared in package.json but not directly imported in source):
  - `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`
- **Lucide React** ^1.14.0 for icons
- **class-variance-authority** ^0.7.1 + **clsx** ^2.1.1 + **tailwind-merge** ^3.5.0 for class merging (`cn()` in `src/lib/utils.ts`)

## PWA

- **vite-plugin-pwa** ^1.3.0 with Workbox
- Service worker with runtime caching for Firestore and Google APIs
- `autoUpdate` register type
- Portrait orientation, standalone display, da-DK language

## Internationalization

- **i18next** ^26.0.10 + **react-i18next** ^17.0.7
- 2 locales: da-DK (default), en-US
- Resources loaded from static JSON files (`src/i18n/da.json`, `src/i18n/en.json`)

## AI / ML

- **NVIDIA NIM API** (OpenAI-compatible) via `openai` ^6.37.0 SDK
- 2 models: `meta/llama-3.1-8b-instruct` (fast categorization) and `nvidia/llama-3.3-nemotron-super-49b-v1` (enrichment + insights)
- Guided JSON structured output via `extra_body.guided_json`

## Barcode Scanning

- **react-zxing** ^2.1.0 for camera-based barcode scanning
- **@zxing/library** ^0.21.3 (peer dependency)

## Backend

- **Firebase** ^12.13.0 (client SDK):
  - Firebase Auth (Google sign-in via `signInWithPopup`)
  - Cloud Firestore (real-time with `onSnapshot`)
  - No Firebase Functions or SSR — all logic client-side

## Configuration

| File | Purpose |
|------|---------|
| `vite.config.ts` | Build, plugins (React, Tailwind, PWA), path alias `@` → `/src` |
| `tsconfig.json` | Project references to app + node configs |
| `tsconfig.app.json` | App config: ES2023 target, DOM lib, bundler resolution, strict linting |
| `tsconfig.node.json` | Node config for vite.config.ts |
| `eslint.config.js` | Flat ESLint 10 config: TS + React Hooks + React Refresh |
| `.env.example` | Required env vars (Firebase + NVIDIA API key) |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NVIDIA_API_KEY` | NVIDIA NIM API key for AI calls |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
