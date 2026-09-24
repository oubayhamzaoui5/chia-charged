# Chia Charged — technical handover

This repository is the source handover package. Public launch requires the hoster's environment setup and the owner's content approval below. Do not deploy a local preview or synthetic `build:check` output.

## Start here

1. Read [README](README.md), then [hoster runbook](docs/hoster-handover.md).
2. Use Node from `.nvmrc`, the lockfile and pinned PocketBase installer. Run `npm ci` and `npm run setup:backend` in a clean checkout.
3. Apply migrations with both migration and hook directories configured. Ship all hooks and bundled blog images. Three starter articles install automatically; existing matching posts are preserved.
4. Create private persistent storage and credentials, configure `.env.example`, and create the backend service account plus owner dashboard administrator. Never expose the backend service credentials in browser code.
5. Run `npm test`, `npm run lint`, and `npm run build:check`. On Linux, `bash scripts/verify-linux.sh` automates these steps. Set `REDIS_TEST_BINARY` to run the disposable real Redis test too.
6. Configure actual deployment values, run `npm run build`, then supervise Next, PocketBase and Redis behind HTTPS. Complete the acceptance checks below before enabling public sales.

## Verification coverage

| Area | Automated/observed coverage | Still requires deployed environment |
|---|---|---|
| Payments | Mocked Stripe session/webhook paths, cents, tax totals, replay and state validation | Business Stripe sandbox purchase/refund and webhook delivery |
| Inventory/orders | Concurrent reservations, cancellation/refund operations, permission checks | Fulfillment rehearsal with owner |
| Mail | Actual PocketBase SMTP transport to a local-only mail catcher: support, guest receipt, verification and reset; rejected-recipient retry | SMTP provider authentication/TLS, sender domain, inbox delivery and correct public links |
| Rate limits | Real disposable Redis: concurrent limits, TTL repair, expiration, failure denial and recovery | Deployed Redis credentials/TLS, ingress IP handling, monitoring |
| Recovery | Offline synthetic PocketBase data/file restore, permissions and encrypted credential recovery | Scheduled encrypted off-server backups and deployed full-data restore |
| Installation | Fresh Linux install, migrations, original blog assets, build/type checks and dependency audit | Final host/domain configuration and service restart behavior |
| Browser | Representative product-to-cart-to-checkout, missing-payment state, mobile form labels/width, support confirmation and login checks | Owner acceptance across supported browsers/devices; comprehensive accessibility/performance audit |

The lint gate prevents regression; it does not mean all historical findings are resolved. Full detail remains available through `npm run lint:full`. Tests do not replace real payment/email/provider acceptance.

## Storage that must survive deployment

- PocketBase data directory, including database and uploaded files.
- Encrypted credential store and its encryption key, backed up separately and privately.
- Protected runtime configuration and any backend encryption key.
- **Blog body images saved by the website:** `public/blog-images/` and legacy `public/blog/`, if present. These are separate from PocketBase cover images. Persist/mount these directories across releases and include them in backups. Give the website user write access; never replace them with an empty release directory.

## Hoster must complete before public sales

- Real HTTPS origins, reverse proxy with correctly replaced forwarded headers, private backend/Redis access, dedicated service users and restart policies.
- Payment credentials/webhook secret, correct Stripe account/tax settings, sandbox acceptance.
- SMTP sender/provider, authentication email URLs, `CHIA_PUBLIC_APP_URL`; enable delivery only after inbox tests.
- Monitoring for downtime, payment/webhook failures, failed or uncertain notification jobs, disk capacity and backup age.
- A documented recovery drill and rollback plan. Several migrations are forward-only: reverting code alone is unsafe.

## Owner must complete

Dashboard: business identity/contact details, shipping price, policies/terms, product prices/stock/ingredients/allergens/nutrition, storage/preparation, optional social URLs and first-order discount settings. Blank social links stay hidden.

Review all product, blog and testimonial claims before publication. Original articles/testimonials and graphics were retained by request; some statements conflict with supplied whey/milk and sugar information. Rating totals and verified badges are editorial values, not calculated purchase verification. Edit or unpublish inaccurate content through the dashboard.

## Delivery contents

Provide this Git repository or an archive of a named commit. Do not send local runtime folders, `.env.local`, production databases, private keys or credentials inside the source archive. Transfer any necessary credentials separately through the owner's secure channel. Use [VPS evidence](docs/vps-verification.md) and [progress log](docs/production-readiness-progress.md) for dated verification details.
