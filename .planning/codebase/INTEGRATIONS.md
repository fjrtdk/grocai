# Integrations — GrocAI

## Firebase (Google)

**Purpose:** Authentication, database, and real-time sync.

**Auth:** Google Sign-In via `signInWithPopup()` using `GoogleAuthProvider`. Declared in `src/lib/firebase.ts:16`.

**Firestore:** All data stored in Firestore with real-time listeners (`onSnapshot`). Collections:
- `users/{uid}` — User profile + preferences
- `lists/{listId}` — Grocery lists with member-based access
- `lists/{listId}/items/{itemId}` — List items (subcollection)
- `lists/{listId}/activity/{eventId}` — Activity log (subcollection)
- `pantry/{userId}/items/{itemId}` — Pantry items per user
- `insights/{userId}/tips/{tipId}` — AI-generated insight tips

**Security:** Firestore security rules enforce member-based access for lists (`firestore.rules`). Owners can update/delete lists; editors can write items. Pantry and insights are user-private.

**Offline:** PWA service worker caches Firestore requests via Workbox `NetworkFirst` strategy.

## NVIDIA NIM API

**Purpose:** AI-powered product categorization, enrichment, and insights.

**Endpoint:** `https://integrate.api.nvidia.com/v1`

**Authentication:** API key via `NVIDIA_API_KEY` environment variable.

**Models used:**
- `meta/llama-3.1-8b-instruct` — Fast categorization (`src/lib/ai.ts:4`)
- `nvidia/llama-3.3-nemotron-super-49b-v1` — Product enrichment + insights (`src/lib/ai.ts:5`)

**Features:**
- Structured JSON output via `guided_json` for deterministic schemas
- Browser-side API calls (`dangerouslyAllowBrowser: true`)
- 3 functions: `categorizeItem`, `enrichProduct`, `generateInsights`

**Edge case:** All AI calls wrapped in try/catch with graceful fallback to defaults (`src/components/items/AddItemSheet.tsx:59-75`).

## PriceTracker.dk API

**Purpose:** Danish grocery price lookup by barcode (EAN).

**Endpoint:** `https://api.pricetracker.dk/public/product/{ean}`

**Authentication:** None (public API).

**Returns:** Product name, brand, category, image, price stats (low/high/avg), store info.

**Timeout:** 3 seconds (`AbortSignal.timeout(3000)`).

## Open Food Facts

**Purpose:** Global open food product database lookup.

**Endpoint:** `https://world.openfoodfacts.org/api/v2/product/{ean}.json`

**Authentication:** None. User-Agent: `GrocAI/1.0 (grocai@app)`.

**Returns:** Product name, brand, category, images.

**Timeout:** 3 seconds.

## Open Products Facts

**Purpose:** Non-food product database (cosmetics, hygiene, cleaning).

**Endpoint:** `https://world.openproductsfacts.org/api/v2/product/{ean}.json`

**Authentication:** None. User-Agent: `GrocAI/1.0 (grocai@app)`.

**Returns:** Product name, brand, category, images.

**Timeout:** 3 seconds.

## Barcode Lookup Flow

1. Normalize EAN to 13 digits (`src/lib/barcode.ts:7-9`)
2. Query all 3 APIs in parallel via `Promise.allSettled` (`src/lib/barcode.ts:94-98`)
3. Return first successful result (priority: PriceTracker → OpenFoodFacts → OpenProductsFacts)
4. Return `{ found: false }` if all fail

## Missing / Not Yet Integrated

- No Firebase Cloud Functions
- No push notifications (despite PWA setup)
- No external analytics or error monitoring (Sentry, etc.)
- No CI/CD pipeline configured
