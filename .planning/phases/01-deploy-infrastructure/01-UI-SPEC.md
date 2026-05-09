---
phase: 1
slug: deploy-infrastructure
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-09
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for Deploy Infrastructure phase. Generated from existing codebase patterns and discuss-phase decisions.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn-style (custom, no CLI) |
| Preset | not applicable |
| Component library | Custom primitives in `src/components/ui/` |
| Icon library | Lucide React ^1.14.0 |
| Font | system-ui, -apple-system, sans-serif (monospace for UI) |

---

## Spacing Scale

Declared values (Tailwind v4 defaults, verified against codebase):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 16px | Default element spacing, card padding |
| lg | 24px | Section padding, card gaps |
| xl | 32px | Layout gaps, sidebar width |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions: none — Tailwind v4 defaults used throughout

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px (text-base) | 400 | 1.5 |
| Label | 14px (text-sm) | 500 | 1.25 |
| Heading | 20px (text-xl) | 600 | 1.25 |
| Display | 24px (text-2xl) | 700 | 1.2 |

---

## Color

All colors defined in `src/index.css:3-37` as OKLCH tokens.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `oklch(0 0 0)` | Background, page surfaces |
| Secondary (30%) | `oklch(0.09 0.01 260)` | Cards, sidebar, popovers |
| Accent (10%) | `oklch(0.15 0.01 260)` | Selected items, hover states, interactive elements |
| Destructive | `oklch(0.6 0.2 20)` | Delete actions, dangerous buttons only |
| Muted | `oklch(0.6 0.01 260)` | Secondary text, placeholders |
| Success | `oklch(0.6 0.18 145)` | Checked items, expiry-green |
| Warning | `oklch(0.7 0.18 70)` | Expiry-yellow, medium urgency |
| Danger | `oklch(0.6 0.2 20)` | Expiry-red, high urgency |
| Border/Input | `oklch(0.2 0.01 260)` | All borders and input outlines |

Accent reserved for: hover states, active navigation items, interactive element backgrounds

---

## Copywriting Contract

All copy is Danish (da-DK). Locale keys defined in `src/i18n/da.json`.

| Element | Copy | i18n Key |
|---------|------|----------|
| Error boundary fallback | "Noget gik galt" + "Prøv igen" button | `common.error`, `common.retry` (or new `error.title`) |
| Empty state — lists | "Ingen lister endnu" + "Opret din første indkøbsliste" CTA | `list.noLists`, `list.noListsHint` |
| Empty state — list items | "Ingen varer på listen" + "Scan stregkode eller skriv varenavn" | `item.noItems`, `item.addItemHint` |
| Empty state — pantry | "Dit pantry er tomt" + "Scan eller tilføj varer" | `pantry.noItems`, `pantry.noItemsHint` |
| Empty state — dashboard | "Ingen fastgjorte lister" + "Gå til lister" (new key) | New key: `dashboard.noPinnedLists` |
| Loading indicator | "Indlæser..." | `common.loading` |
| Primary CTA | "Prøv igen" (retry), "Opret liste" (create), "Tilføj vare" (add) | Various |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| Custom (src/components/ui/) | All existing primitives | not required |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-09
