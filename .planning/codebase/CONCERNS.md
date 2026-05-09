# Concerns — GrocAI

## Technical Debt

1. **Zustand declared but unused**
   - `zustand` ^5.0.13 in `dependencies` but no store created or imported anywhere
   - Adds 3.2KB to bundle for no benefit

2. **Radix UI primitives likely unused**
   - 9 `@radix-ui/*` packages in dependencies
   - Source only imports from `react-zxing`, `lucide-react`, `firebase`, `react-router-dom`, `i18next`
   - Custom UI components in `src/components/ui/` re-implement similar patterns (Dialog, Checkbox, Avatar match Radix equivalents)
   - Either switch to Radix or remove unused packages

3. **OpenAI SDK used but no real OpenAI calls**
   - `openai` ^6.37.0 in devDependencies
   - NVIDIA NIM API uses OpenAI-compatible SDK, but the SDK is in `devDependencies` not `dependencies`
   - Should be in `dependencies` since it's used at runtime

4. **No error monitoring**
   - No Sentry, LogRocket, or any error tracking
   - Silent catch blocks in `AddItemSheet.tsx:59` — failures are swallowed

5. **No pagination or virtualization**
   - Lists and pantry load all items into memory
   - Will become slow with 1000+ items

6. **No test infrastructure**
   - Zero tests across the entire codebase
   - No test framework installed

## Security Concerns

1. **Browser-side AI API key**
   - `NVIDIA_API_KEY` exposed in client bundle via `import.meta.env.VITE_NVIDIA_API_KEY`
   - `dangerouslyAllowBrowser: true` explicitly in `src/lib/ai.ts:14`
   - Any user can extract the key from browser devtools
   - **Mitigation:** NVIDIA NIM API keys should be restricted or proxied through a backend

2. **Firestore rules: weak member lookup**
   - `src/firestore.rules:9-10` uses `resource.data.members.keys()` which works but doesn't validate role type
   - No rate limiting on writes

3. **User lookup by email in ShareDialog**
   - `src/components/sharing/ShareDialog.tsx:32-36` queries Firestore by document ID using email as key
   - Pattern is `getDoc(doc(db, 'users', email))` — assumes email is the doc ID
   - No validation that the email format is correct
   - Could leak whether an email is registered (enumeration)

## Performance Concerns

1. **No lazy loading**
   - All pages loaded eagerly — no `React.lazy()` or code splitting
   - Initial bundle includes all 7 pages, all UI components, all hooks

2. **No image optimization**
   - Product images loaded directly from external URLs with no resizing or caching strategy

3. **No request deduplication**
   - Multiple components using the same hook create separate `onSnapshot` listeners
   - Example: Dashboard and ListsHome both call `useLists()` with the same userId

4. **Firestore listener proliferation**
   - Each mount of `useListItems` creates a new `onSnapshot` listener
   - Navigation between lists creates and destroys listeners without caching

## Missing Features (From SPEC Docs)

1. **Activity logs** — `ActivityLog` type defined (`src/types/index.ts:125-131`), subcollection path exists in Firestore rules (`/activity/{eventId}`), but no hooks or UI to read/write activity events

2. **AI insight generation** — `InsightsBanner` component reads from Firestore (`insights/{userId}/tips`) but no hook or background job writes insight data — tips collection will always be empty

3. **Zustand state management** — Declared but unused; no store for shared state like current list, selected items, or UI preferences

## Known Issues

1. **README is default Vite template** — Not updated with project-specific info
2. **OpenAI SDK in devDependencies** — Causes build warnings; runtime dependency in devDependencies
3. **`list: any` type in ListsHome** — `ListCard` component typed `list: any` instead of `GroceryList` (`src/pages/ListsHome.tsx:138`)
4. **No 404 route** — React Router has no `path="*"` catch-all route
5. **window.prompt for list name** — `Dashboard.tsx:24` uses `prompt()` for list creation instead of a proper form
6. **Firestore `deleteField()` import** — `src/components/sharing/ShareDialog.tsx:3` imports `deleteField` from `firebase/firestore` which is correct but unused in the function at line 49 (but actually used — it IS used)

## Development Workflow

- **No pre-commit hooks** — no Husky, lint-staged, or commitlint
- **No CI/CD** — no GitHub Actions, no deployment config
- **No Docker** — no containerization
- **No environment validation** — missing env vars fail silently at runtime
