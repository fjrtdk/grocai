# Phase 2: CI/CD + Testing Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 2-CI/CD + Testing Foundation
**Areas discussed:** Auto-deploy approach, Test setup depth, CI workflow design, Test environment choice, Pre-commit hooks

---

## Auto-deploy Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel git integration alone | Push → Vercel builds and deploys directly. Tests would need to run separately. | |
| GitHub Actions → Vercel | GH Actions workflow runs lint + test + build first. Only if all pass does it trigger Vercel deploy. | ✓ |

**User's choice:** GitHub Actions → Vercel
**Notes:** Safer approach — tests gate the deployment.

---

## Test Setup Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Bare install only | npm install, create config, add script. No test files. | |
| Install + smoke test | Same + write 1-2 smoke tests to validate setup works in CI. | ✓ |
| Full: install + smoke + coverage | Same + configure coverage thresholds and reporting. | |

**User's choice:** Install + smoke test
**Notes:** Setup must be validated in CI, but no coverage thresholds yet.

---

## CI Workflow Design

| Option | Description | Selected |
|--------|-------------|----------|
| Single workflow, sequential jobs | One file, 3 sequential jobs: lint → test → build. Simple. | ✓ |
| Split by purpose | Separate workflow files per job type. Parallel where possible. | |

**User's choice:** Single workflow, sequential jobs

Trigger scope:

| Option | Description | Selected |
|--------|-------------|----------|
| Push to main only | Only main branch triggers CI. | |
| All pushes + PRs to main | Run on push to any branch AND on PRs to main. | ✓ |

**User's choice:** All pushes + PRs to main

---

## Test Environment Choice

| Option | Description | Selected |
|--------|-------------|----------|
| jsdom | Industry standard, more battle-tested, wider API coverage. Slightly slower. | |
| happy-dom | Lighter, faster, works well with Vitest. Sufficient for most React component tests. | ✓ |

**User's choice:** happy-dom

---

## Pre-commit Hooks

| Option | Description | Selected |
|--------|-------------|----------|
| CI only | No local hooks. All checks in CI on push. | ✓ |
| Husky + lint-staged | Install husky and lint-staged. Run lint + tsc on staged files before each commit. | |

**User's choice:** CI only
**Notes:** Keep commit flow fast, catch issues in CI.

---

## OpenCode's Discretion


## Deferred Ideas

None — all discussion stayed within phase scope.
