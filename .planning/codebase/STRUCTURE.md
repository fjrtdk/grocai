# Structure — GrocAI

## Top-Level Layout

```
GrocAI/
├── index.html                  # SPA entry point
├── package.json                # Dependencies + scripts
├── vite.config.ts              # Build config + plugins
├── tsconfig.json               # TypeScript project references
├── tsconfig.app.json           # App TS config
├── tsconfig.node.json          # Node (vite) TS config
├── eslint.config.js            # Flat ESLint config
├── .env.example                # Required env vars
├── .gitignore
├── README.md                   # Vite template boilerplate (outdated)
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Composite indexes
├── SPEC-01-ARCHITECTURE.md     # Architecture spec doc
├── SPEC-02-DATA-MODEL.md       # Data model spec doc
├── SPEC-03-AI.md               # AI integration spec doc
├── SPEC-04-BARCODE.md          # Barcode spec doc
├── SPEC-05-SECURITY.md         # Security spec doc
├── dist/                       # Build output (gitignored)
├── node_modules/               # Dependencies (gitignored)
├── public/
│   ├── favicon.svg             # App icon
│   └── icons.svg               # SVG icon sprite
└── src/
    ├── main.tsx                # React entry
    ├── App.tsx                 # Root component (auth gate + router)
    ├── index.css               # Tailwind v4 theme + base styles
    ├── i18n/
    │   ├── index.ts            # i18next init
    │   ├── da.json             # Danish translations
    │   └── en.json             # English translations
    ├── types/
    │   └── index.ts            # All TypeScript interfaces + type aliases
    ├── lib/
    │   ├── firebase.ts         # Firebase init (app, auth, db, provider)
    │   ├── ai.ts               # NVIDIA NIM API wrapper (3 functions)
    │   ├── barcode.ts          # Barcode lookup (3 providers, parallel)
    │   └── utils.ts            # cn(), formatCurrency(), daysUntil(), getExpiryColor()
    ├── hooks/
    │   ├── useAuth.ts          # Auth state + Google sign-in
    │   ├── useFirestore.ts     # Generic useCollection/useDocument + CRUD
    │   ├── useLists.ts         # Grocery lists with member filtering
    │   ├── useListItems.ts     # List items with check toggle + count sync
    │   └── usePantry.ts        # Pantry items CRUD
    ├── pages/
    │   ├── AuthPage.tsx        # Google sign-in screen
    │   ├── Dashboard.tsx       # Home with pinned list preview
    │   ├── ListsHome.tsx       # Full list management
    │   ├── ListDetail.tsx      # Single list with items
    │   ├── Scanner.tsx         # Barcode scanner + manual input
    │   ├── Pantry.tsx          # Pantry inventory grid
    │   └── Settings.tsx        # User settings + locale
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx    # Sidebar + MobileNav + content wrapper
    │   │   ├── Sidebar.tsx     # Desktop nav (5 tabs)
    │   │   └── MobileNav.tsx   # Bottom tab bar (5 tabs)
    │   ├── items/
    │   │   ├── ItemRow.tsx     # Single item with checkbox + meta
    │   │   └── AddItemSheet.tsx# Add item form with AI categorization
    │   ├── insights/
    │   │   └── InsightsBanner.tsx # AI tip carousel
    │   ├── sharing/
    │   │   └── ShareDialog.tsx    # Share list via email + link
    │   └── ui/
    │       ├── button.tsx      # Button (5 variants, 4 sizes)
    │       ├── card.tsx        # Card container
    │       ├── input.tsx       # Text input
    │       ├── badge.tsx       # Badge (4 variants)
    │       ├── checkbox.tsx    # Checkbox toggle
    │       ├── dialog.tsx      # Modal dialog
    │       ├── sheet.tsx       # Bottom sheet
    │       └── avatar.tsx      # User avatar (image or initials)
    └── dist/                   # Build output
```

## File Naming Conventions

- **Components:** PascalCase kebab for UI primitives (`button.tsx`, `card.tsx`), PascalCase for domain components (`ItemRow.tsx`, `AddItemSheet.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAuth.ts`, `useListItems.ts`)
- **Pages:** PascalCase (`Dashboard.tsx`, `ListDetail.tsx`)
- **Libraries:** camelCase (`firebase.ts`, `utils.ts`)
- **Types:** PascalCase (`GroceryList`, `ListItem`, `BarcodeResult`)
- **Specs:** PascalCase with prefix (`SPEC-01-ARCHITECTURE.md`)

## Key File Locations

| What | Path |
|------|------|
| Firestore init | `src/lib/firebase.ts` |
| AI API wrapper | `src/lib/ai.ts` |
| Barcode lookup | `src/lib/barcode.ts` |
| Utility functions | `src/lib/utils.ts` |
| Type definitions | `src/types/index.ts` |
| Theme + CSS | `src/index.css` |
| i18n setup | `src/i18n/index.ts` |
| Auth hook | `src/hooks/useAuth.ts` |
| Generic Firestore hooks | `src/hooks/useFirestore.ts` |
| UI primitives | `src/components/ui/` |
| Layout shell | `src/components/layout/AppShell.tsx` |
| Firestore rules | `firestore.rules` |
| Firestore indexes | `firestore.indexes.json` |
| Build config | `vite.config.ts` |
| ESLint config | `eslint.config.js` |
