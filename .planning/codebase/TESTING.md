# Testing — GrocAI

## Current State

**No test infrastructure exists.** The project has:
- No test framework installed (no Vitest, Jest, Playwright, etc.)
- No test files anywhere in the repository
- No `test` script in `package.json`
- No CI configuration that runs tests

## Available Dev Scripts

From `package.json`:
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

## What Should Be Tested (Gaps)

Given the app architecture, these layers need test coverage:

| Layer | Suggested Approach | Priority |
|-------|-------------------|----------|
| AI API wrapper (`src/lib/ai.ts`) | Unit tests with mocked OpenAI client | High |
| Barcode lookup (`src/lib/barcode.ts`) | Unit tests with mocked fetch | High |
| Utility functions (`src/lib/utils.ts`) | Pure function unit tests | Medium |
| UI components (`src/components/ui/*`) | Component tests (Vitest + Testing Library) | Medium |
| Custom hooks (`src/hooks/*`) | Hook tests with mocked Firestore | Medium |
| Page components (`src/pages/*`) | Integration tests with router | Low |
| Auth flow (`src/hooks/useAuth.ts`) | Integration tests with emulator | Low |

## Test Dependencies Needed

- **Vitest** (Vite-native test runner)
- **@testing-library/react** (component rendering)
- **@testing-library/jest-dom** (DOM matchers)
- **msw** or similar (API mocking for barcode/AI endpoints)
- **firebase-tools** emulator suite (Firestore integration tests)

## Lint Coverage

- **ESLint** with `typescript-eslint` recommended rules + React Hooks plugin + React Refresh plugin
- Runs via `npm run lint` which executes `eslint .`
- No Prettier or other formatter configured
