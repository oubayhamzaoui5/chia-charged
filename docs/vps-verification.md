# VPS verification — 23 September 2026

## Scope and safety

Read server `/root/CLAUDE.md` after connecting as the Ubuntu login user through `sudo -i`. Located existing Chia frontend and PocketBase processes, confirmed health locally and from outside the server, and verified that public PocketBase admin UI returns 403. Existing site/data, process configuration and firewall were not changed.

Verification uses a separate checkout under the Ubuntu user's `chia-verification` directory, runs without root, creates only disposable synthetic databases, and uses temporary Node 22.23.2 with PocketBase 0.31.0. System Node remains unchanged. No real email or payment was initiated.

## Findings repaired

- Fresh `npm ci` exposed incomplete peer dependency resolution in the old lockfile. Regenerated lockfile with normal peer resolution and added project `.npmrc` so machine-level legacy settings cannot silently change installation behavior.
- Lint baseline messages embedded absolute Windows source paths. Normalized those diagnostic location lines for cross-platform comparison; preserved rules, severity, source text and occurrence counts. Added regression coverage.
- Added reusable `bash scripts/verify-linux.sh` and disposable `npm run test:restore` rehearsal.

## Evidence and remaining checks

Release `e6fa5d1` passed both the owner's Ubuntu VPS and [GitHub Linux checks](https://github.com/oubayhamzaoui5/chia-charged/actions/runs/35923025435): clean installation, pinned PocketBase setup, dependency audit, lint regression check, all automated suites including offline backup/restore, and production build/type verification. Audit reported zero vulnerabilities; lint still contains 234 historical findings, with zero new findings.

The restore rehearsal verifies saved settings, product stock/prices, uploaded image bytes, guest write restrictions and encrypted credential recovery with the correct key (and rejection of an incorrect key). It uses a stopped synthetic database and a separate restored instance. It does not test existing business data, scheduled/off-server backups, or full order-history recovery. Raw test output remains private on the owner's server under `chia-verification/verification-e6fa5d1.log`.

The public server URL still serves the previous release. Test checkout is not a deployed production environment. `build:check` uses synthetic configuration; its output must not be promoted to a public release.

Remaining deployment gates: isolated HTTPS staging origin, production service supervision and dedicated users, persistent data/secret provisioning, actual Redis connectivity/outage tests, Stripe sandbox and SMTP inbox checks, scheduled off-server backups and real deployment restore drill, mobile/accessibility acceptance, and owner-approved business/product/testimonial content. Redis was not present in the server command path or listening sockets during inspection.

## 24 September 2026 — handover acceptance

Release `9d77629` passed fresh Ubuntu verification with pinned Node 22.23.2 and PocketBase 0.31.0, plus [GitHub checks](https://github.com/oubayhamzaoui5/chia-charged/actions/runs/36030083309). Clean installation, audit (zero reported vulnerabilities), every default test suite, real Redis integration, lint regression gate (233 historical findings; zero new), and build/type checks passed. Private server evidence: `chia-verification/verification-9d77629.log`.

Redis ran as a disposable loopback process from locally extracted Ubuntu packages, with password authentication. No system Redis installation or service change was made. Tests covered concurrent limits, expiration, missing-TTL repair, denial during outage and reconnection. The deployed Redis environment remains a hoster acceptance task.

Actual PocketBase SMTP transport sent support messages, itemized guest receipts and account verification/reset emails to a local-only SMTP sink. Rejected recipients entered retry state. This caught and fixed native PocketBase JSON-field decoding in the notification worker and receipt renderer. Provider TLS/authentication, inbox delivery and live public links remain untested.

Browser acceptance covered admin sign-in, saving/reloading an optional social URL (then clearing it), and disabled password reset with a missing token. Earlier local checks covered product/cart/US checkout totals, unavailable payment configuration, mobile checkout labels/width and support confirmation. These are representative checks, not exhaustive browser/accessibility certification.

Code is suitable for technical handover with the explicit launch gates in [HANDOVER.md](../HANDOVER.md). Existing public VPS site remains on its previous release; no production data or services were replaced. Original blog/testimonial claims still require owner review before public sales.
