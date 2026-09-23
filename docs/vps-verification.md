# VPS verification — 23 September 2026

## Scope and safety

Read server `/root/CLAUDE.md` after connecting as the Ubuntu login user through `sudo -i`. Located existing Chia frontend and PocketBase processes, confirmed health locally and from outside the server, and verified that public PocketBase admin UI returns 403. Existing site/data, process configuration and firewall were not changed.

Verification uses a separate checkout under the Ubuntu user's `chia-verification` directory, runs without root, creates only disposable synthetic databases, and uses temporary Node 22.23.2 with PocketBase 0.31.0. System Node remains unchanged. No real email or payment was initiated.

## Findings repaired

- Fresh `npm ci` exposed incomplete peer dependency resolution in the old lockfile. Regenerated lockfile with normal peer resolution and added project `.npmrc` so machine-level legacy settings cannot silently change installation behavior.
- Lint baseline messages embedded absolute Windows source paths. Normalized those diagnostic location lines for cross-platform comparison; preserved rules, severity, source text and occurrence counts. Added regression coverage.
- Added reusable `bash scripts/verify-linux.sh` and disposable `npm run test:restore` rehearsal.

## Evidence and remaining checks

Release `6f67d9a` passed GitHub Linux clean installation, pinned PocketBase setup, dependency audit, lint regression check, automated tests and production build verification. Audit reported zero vulnerabilities; lint still contains 234 historical findings. The VPS independently passed installation, audit, lint and automated suites; final build and newly added restore test results are recorded below after completion.

The public server URL still serves the previous release. Test checkout is not a deployed production environment. `build:check` uses synthetic configuration; its output must not be promoted to a public release.

Remaining deployment gates: isolated HTTPS staging origin, production service supervision and dedicated users, persistent data/secret provisioning, actual Redis connectivity/outage tests, Stripe sandbox and SMTP inbox checks, scheduled off-server backups and real deployment restore drill, mobile/accessibility acceptance, and owner-approved business/product/testimonial content. Redis was not present in the server command path or listening sockets during inspection.
