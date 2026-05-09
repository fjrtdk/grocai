# GrocAI — Project Guide

## Current State

GrocAI is a Danish-first AI-powered grocery shopping PWA. Fully coded but not yet deployed.

## Active Phase

**Phase 1: Deploy Infrastructure** — Get app live on Vercel with UX polish.

## v1 Requirements

| ID | Description | Phase |
|----|-------------|-------|
| DEPLOY-01 | Deploy to Vercel with single command | 1 |
| DEPLOY-02 | SPA routing on page refresh (vercel.json) | 1 |
| POLISH-01 | React error boundary | 1 |
| POLISH-02 | Loading states on all pages | 1 |
| POLISH-03 | Empty states for lists/pantry | 1 |
| DEPLOY-03 | Auto-deploy on push to main | 2 |
| TEST-00 | Vitest installed and configured | 2 |
| FEAT-01 | AI insights persist to Firestore | 3 |

## Key Decisions

- **Deploy first** — Get live before deep polish
- **Keep Firebase Auth** — Already integrated
- **Danish-only** — Danish speaker audience
- **MVP mode** — Each phase delivers minimum viable increment

## Workflow

- Mode: YOLO (auto-approve)
- Granularity: Coarse (3 phases)
- Execution: Parallel
- Research: Yes (before each phase)
- Plan check: Yes
- Verifier: Yes

## Commands

- `/gsd-plan-phase 1` — Start Phase 1 planning
- `/gsd-discuss-phase 1` — Discuss Phase 1 approach
