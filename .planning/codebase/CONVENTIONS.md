# Conventions — GrocAI

## Code Style

- **TypeScript** throughout — no JS files (except config files)
- **Functional components** with hooks — no class components
- **Explicit imports** — `import type` for type-only imports
- **verbatimModuleSyntax** enabled in `tsconfig.app.json` — type imports must use `import type`
- **Arrow functions** for all components and hooks
- **Named exports** — no default exports (except `App.tsx` default export)

## Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `ListItem`, `AddItemSheet` |
| Hooks | camelCase with `use` prefix | `useAuth`, `useListItems` |
| Functions | camelCase | `categorizeItem`, `lookupBarcode` |
| Interfaces | PascalCase | `GroceryList`, `BarcodeResult` |
| Type aliases | PascalCase with `type` | `type GroceryCategory = ...` |
| Env vars | UPPER_SNAKE_CASE with `VITE_` prefix | `VITE_FIREBASE_API_KEY` |
| Files | camelCase (hooks/lib) or PascalCase (components/pages) | `useAuth.ts`, `ItemRow.tsx` |

## Error Handling

- **AI calls:** Wrapped in try/catch with graceful fallback to defaults (`AddItemSheet.tsx:59-75`)
- **Barcode lookups:** `Promise.allSettled` ensures one API failure doesn't block others
- **Firestore hooks:** `onSnapshot` error callbacks silently set `loading = false` without error state
- **No centralized error boundary** in the app
- **No explicit error logging** (no Sentry, no console.error in place)

## Data Patterns

- **Reads:** Real-time via `onSnapshot` in hooks — no manual data fetching
- **Writes:** Optimistic via Firebase SDK — no local state caching before Firestore confirm
- **Timestamps:** `serverTimestamp()` for all createdAt/updatedAt fields
- **Counts:** Firestore `increment()` for item counts (handles concurrent edits)

## State Management

- **No global store** — Zustand declared but unused
- Each page manages its own data through custom hooks
- Auth state flows via `useAuth()` → passed to domain hooks as `userId`

## Firestore Security

- Member-based access control via `members: Record<string, Role>` field on grocery lists
- Owner-only for update/delete at list level
- Owner/editor for write at items subcollection
- User-private data for pantry and insights

## React Patterns

- **No useEffect for data fetching** — Firestore `onSnapshot` handles it via hooks
- **useCallback** used for barcode decode handler in Scanner
- **State lifting** minimal — each page self-contained
- **Props drilling** for callbacks (no context beyond router + i18n)

## Styling

- **Tailwind CSS v4** with `@theme` directive for design tokens
- **Dark theme only** — `--color-background: oklch(0 0 0)` (pure black)
- **No CSS modules or styled-components** — all styles via Tailwind utility classes
- **Key colors:** primary (white), secondary/muted/accent (dark grays), destructive (red), success (green), warning (yellow)
- **Consistent border radius:** `--radius-sm: 0.375rem`, `--radius-md: 0.5rem`, `--radius-lg: 0.75rem`, `--radius-xl: 1rem`

## Internationalization

- All user-facing strings go through `useTranslation()` / `t()` calls
- Default locale: `da-DK`
- Translation keys follow dot-notation: `app.name`, `auth.welcome`, `list.items`, `item.addItem`
- Fallback language: `da-DK`

## Imports Ordering

1. React / third-party libraries
2. Project hooks (`../hooks/...`)
3. Project components (`../components/...`)
4. Project lib (`../lib/...`)
5. Types (`../types` or `../../types`)
6. Icons from `lucide-react`
