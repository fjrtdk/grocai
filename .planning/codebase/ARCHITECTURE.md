# Architecture — GrocAI

## System Design

Single-page application (SPA) with client-only architecture. All business logic runs in the browser. Firebase provides auth and real-time data persistence.

```
┌──────────────────────────────────────────────────────┐
│                   Browser (PWA)                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  App Shell (Sidebar + MobileNav + <main>)      │  │
│  │  ┌────────┐ ┌──────────┐ ┌──────────────────┐  │  │
│  │  │ Auth   │ │ Router   │ │ Real-time Hooks  │  │  │
│  │  │ Gate   │ │ (6 pages)│ │ (useCollection,  │  │  │
│  │  │        │ │          │ │  useDocument,     │  │  │
│  │  │        │ │          │ │  onSnapshot)      │  │  │
│  │  └────────┘ └──────────┘ └──────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Architecture Pattern

**Feature-based grouping** — pages, hooks, components, and lib are organized by concern rather than by technical role. Each page owns its data-fetching via custom hooks.

No global state management (Zustand declared but unused). Data flows directly from Firestore → custom hooks → page components → UI components.

## Data Flow

```
User Action → Page Component → Custom Hook → Firestore SDK → Firebase
                                                        ↓
User sees UI ← Component re-render ← onSnapshot callback ←┘
```

All mutations follow the same pattern:
1. User triggers action in page/component
2. Page calls hook method (e.g., `addItem`, `toggleCheck`)
3. Hook writes to Firestore via `addDoc`/`updateDoc`/`deleteDoc`
4. `onSnapshot` listener fires → React state updates → re-render

## Key Abstractions

### Generic Firestore Hooks (`src/hooks/useFirestore.ts`)
- `useCollection<T>(path, ...constraints)` — Real-time list subscription
- `useDocument<T>(path)` — Real-time single doc subscription
- `addDocument(path, data)`, `updateDocument(path, data)`, `removeDocument(path)` — Generic CRUD helpers

### Domain-Specific Hooks
- `useAuth()` — Auth state + user profile + Google sign-in (`src/hooks/useAuth.ts`)
- `useLists(userId)` — Grocery lists with filter by member access (`src/hooks/useLists.ts`)
- `useListItems(listId)` — Items within a list with check toggling + count sync (`src/hooks/useListItems.ts`)
- `usePantry(userId)` — Pantry items per user (`src/hooks/usePantry.ts`)

### AI Integration Layer (`src/lib/ai.ts`)
- `categorizeItem(itemName)` → `AICategorization` — fast LLM call for category + storage
- `enrichProduct(ean, rawName, brand, source, locale)` → `AIEnrichment` — full product enrichment
- `generateInsights(locale, context)` → `AIInsightResult` — smart shopping tips

### Barcode Integration (`src/lib/barcode.ts`)
- `lookupBarcode(ean)` → `BarcodeResult` — cascading parallel lookup across 3 providers

## Routing (client-side)

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | `Dashboard` | Pinned list preview + insights |
| `/lists` | `ListsHome` | All lists with CRUD |
| `/lists/:id` | `ListDetail` | Items grouped by category |
| `/scan` | `Scanner` | Barcode camera + manual input |
| `/pantry` | `Pantry` | Grid by storage area |
| `/settings` | `Settings` | Profile, locale, sign-out |

## Auth Gate Pattern

`App.tsx:12-36` implements a simple auth gate:
1. Show spinner while `loading`
2. Show `AuthPage` if no `user`
3. Show `BrowserRouter` + `Routes` if authenticated

## Layout

- **Desktop:** Sticky sidebar (56rem width, hidden `<lg`) + content area
- **Mobile:** Bottom navigation bar (visible only `<lg`) + content area
- Max content width: `max-w-3xl` with horizontal padding
- All authenticated pages wrap in `<AppShell>` component

## Component Tree

```
<App>
  ├─ <AuthPage> (unauthenticated)
  └─ <BrowserRouter>
      └─ <AppShell>
           ├─ <Sidebar> (desktop)
           ├─ <MobileNav> (mobile)
           └─ <main>
                ├─ <Dashboard>
                │    ├─ <InsightsBanner>
                │    └─ <ItemRow> (preview, max 5)
                ├─ <ListsHome>
                │    ├─ <ListCard> (pinned/active/archived sections)
                │    └─ <Dialog> (create list)
                ├─ <ListDetail>
                │    ├─ <ItemRow> (grouped by category)
                │    ├─ <AddItemSheet>
                │    └─ <ShareDialog>
                ├─ <Scanner>
                │    ├─ <video> (camera feed via react-zxing)
                │    └─ <Input> (manual EAN)
                ├─ <Pantry>
                │    └─ <Card> grid (filtered by storage area)
                └─ <Settings>
                     └─ locale switcher + sign out
```

## Entry Points

- **Virtual DOM:** `index.html:11` → `/src/main.tsx`
- **App root:** `/src/App.tsx` — auth gate + routing
- **CSS root:** `/src/index.css` — Tailwind v4 theme config
- **I18n init:** `/src/i18n/index.ts` — i18next bootstrap
