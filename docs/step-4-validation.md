# Step 4 review — 17 September 2026

Local changes prepared. No deployment, business database migration, or real credential changes.

## Changes

- Updated Next and its ESLint configuration to 16.3.5; refreshed dependencies and lockfile. npm audit moved from 16 findings (1 critical, 9 high, 5 moderate, 1 low) to zero reported findings.
- Pinned Node 22.23.2 and tested PocketBase 0.31.0. Backend installer verifies official archive SHA-256 before extraction.
- Copied 79 existing migrations and both runtime hooks into `backend/`. Tests and demo preview now consume repository backend sources and a separately downloaded binary.
- Added GitHub Actions checks for installation, audit, lint regression, disposable database integration tests, and production compilation/type checking.
- Fixed chart tooltip typing exposed by the updated chart library. Prevented build tracing from bundling runtime credential storage. Excluded preview/tool directories from TypeScript.

## Checks completed locally

- All 29 integration scenarios passed (32 Node test entries including parent suites).
- Credential scenarios reran successfully after the build-tracing comment change.
- Production compilation and TypeScript passed with synthetic configuration.
- Dependency audit: zero reported vulnerabilities, including development dependencies.
- Lockfile validation through `npm ci --dry-run` passed. This is not a full clean-checkout installation or a Linux CI run.
- Lint regression gate passed: zero new diagnostics; 289 existing diagnostics remain.

## Explicit limits requiring review

**This is not a clean lint result.** `npm run lint:full` still reports existing type looseness, React hook/compiler issues, unused variables and other findings. `docs/lint-baseline.json` records exact file/rule/message/source-line fingerprints and counts. `npm run lint` rejects new or increased diagnostics, including warnings; parse errors always fail. Do not refresh the baseline to bypass a new failure. Existing behavior-related findings need cleanup before final production approval.

ESLint 9.39.5 restores compatibility but npm marks this major unsupported. It is a temporary development-tool compatibility pin, not the final supported tooling state. Upgrading its incompatible plugin stack remains release debt.

Workflow has been prepared locally, not run on GitHub. Required branch checks/release protection must be configured after repository/hosting decisions. Full clean-checkout/Linux execution remains an acceptance gate. PocketBase version is the previously tested baseline; backend advisories and upgrade compatibility still need release review. Existing visit-cleanup hook remains in Step 14.

Owner approval is required to accept this limited lint baseline before continuing to Step 5; otherwise continue lint cleanup within Step 4. Production readiness is not asserted.

## Manual preview check

Use the [local preview instructions](local-preview.md). Check homepage/product layout, admin dashboard/chart, and saving a US shipping rate. Report page, action and result. Payment submission remains disabled in this demo.

Next proposed scope after approval: Step 5, trustworthy payment status and verified Stripe webhooks. Decide whether cash on delivery should remain alongside card payments.
