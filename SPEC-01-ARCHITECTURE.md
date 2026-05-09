# SPEC-01: Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (PWA)                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  React 19 + TypeScript + Vite 8                   │  │
│  │  Tailwind v4 (Vercel dark theme)                  │  │
│  │  react-i18next (da-DK default / en-US)            │  │
│  │  react-zxing (camera barcode)                     │  │
│  │  vite-plugin-pwa (offline + install)              │  │
│  └──────────┬───────────────┬──────────────┬──────────┘  │
│             │               │              │             │
│        ┌────▼────┐    ┌────▼────┐    ┌────▼────┐        │
│        │Firebase │    │NVIDIA   │    │PriceTrack│        │
│        │Auth     │    │NIM API  │    │er.dk API│        │
│        │Firestore│    │(2 models)│   │+ OFF     │        │
│        └─────────┘    └─────────┘    └──────────┘        │
└─────────────────────────────────────────────────────────┘
```

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS v4 (Vercel dark theme) |
| Components | Custom shadcn-style primitives (no shadcn CLI dep) |
| Auth | Firebase Auth (Google Sign-In) |
| Database | Cloud Firestore (real-time, offline persistence) |
| AI | NVIDIA NIM API (2 models) |
| Barcode | react-zxing (@zxing/library) client-side |
| Product Data | PriceTracker.dk + OpenFoodFacts + OpenProductsFacts |
| i18n | react-i18next |
| State | zustand + Firestore snapshots |
| PWA | vite-plugin-pwa (Workbox) |
| Deploy | Vercel |

## Key Principles

- **Serverless-first** — No backend server. All services connected directly from browser (API keys embedded at build time).
- **Offline-first** — Firestore persistence cache for data, service worker for static assets.
- **Mobile-first** — Bottom tab nav on mobile, sidebar on desktop. All touch targets ≥44px.
- **AI-enhanced** — Every item add triggers fast AI categorization. Barcode scans trigger deep AI enrichment. Periodic insights based on list + pantry analysis.
