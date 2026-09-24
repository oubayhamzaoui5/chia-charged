# Hoster handover runbook

## Agreed sequence

1. Finish local changes and acceptance tests.
2. Deploy an isolated staging environment on the owner's VPS; use synthetic data, Stripe test mode, and approved email recipients.
3. Demonstrate installation, payments, email, backups/restore and monitoring.
4. Deliver a versioned release and evidence to the business hoster. Public launch is a separate approval.

This document is a procedure, not evidence that deployment/restoration has passed.

## Required services and ownership

| Service | Requirements |
|---|---|
| Next.js | Node version from `.nvmrc`; long-running process; HTTPS reverse proxy; restart policy |
| PocketBase | Pinned binary, one process per data directory, versioned hooks/migrations, persistent database and uploaded files |
| Redis | Shared private instance or managed Redis; authenticated/TLS connection where appropriate |
| Stripe | Business-owned account, test/live credentials kept separate, correct webhook secret and tax setup |
| Email | Business sender identity, SMTP configuration in PocketBase, verified sending domain and approved test inbox |
| Storage | Durable PocketBase data and encrypted credentials; encrypted off-server backups; encryption key backed up separately |
| Monitoring | Process/HTTP health, failed webhooks, failed/uncertain email jobs, Redis failures, backup age and disk space |

Domain/hosting values remain undecided. Do not copy example domains into a live release. Do not expose raw databases, Redis, secrets or PocketBase administrative access publicly without appropriate access controls. Public product images need the configured HTTPS backend file endpoint; do not assume all backend traffic can be denied indiscriminately.

## First staging installation

1. Check out the selected release into a clean directory. Install the pinned Node runtime; run `npm ci` and `npm run setup:backend`.
2. Create dedicated persistent data and credential directories, owned by the service account. Keep them outside replaceable release folders.
3. Set protected server environment from `.env.example`. `APP_URL` and `NEXT_PUBLIC_SITE_URL` must be the same HTTPS origin. Public PocketBase URL must use HTTPS; backend loopback/private connection must match deployment configuration.
4. On a **fresh empty staging data directory**, apply migrations with the PocketBase binary: `pocketbase migrate up --dir=ABSOLUTE_DATA_DIR --migrationsDir=ABSOLUTE_RELEASE/backend/pb_migrations --hooksDir=ABSOLUTE_RELEASE/backend/pb_hooks`. Provision a dedicated backend service superuser using PocketBase's supported operator workflow; put its credentials in Next's protected environment. Create the business dashboard admin with role/admin-manager capability through reviewed backend administration. Never enable public administrator registration.
5. Start PocketBase: `pocketbase serve --http=127.0.0.1:8090 --dir=ABSOLUTE_DATA_DIR --migrationsDir=ABSOLUTE_RELEASE/backend/pb_migrations --hooksDir=ABSOLUTE_RELEASE/backend/pb_hooks`. Adjust bind address only to the approved private network design. Schedule/restart this process through the host supervisor.
6. Generate and securely store the encryption key. Initialize a new credential file using the README command, then set `CREDENTIALS_FILE` to its absolute persistent path. Add Stripe keys through Admin > Keys. Preserve key/file together through updates.
7. Run `npm test`, `npm run lint`, and `npm run build:check` as isolated verification. Then `npm run build` using the target environment and `npm start` behind HTTPS. Do not deploy the synthetic `build:check` output.
8. Configure ingress to replace forwarded IP headers and block direct access before setting `TRUST_PROXY_HEADERS=true`. Verify Redis connectivity, rate-limit exhaustion and outage behavior.
9. Configure Stripe webhook destination `/api/shop/stripe/webhook`, corresponding secret, account tax configuration, and test events supported by the handler. Confirm actual purchase/refund reconciliation.
10. Configure PocketBase SMTP/auth email URLs and its process variables `CHIA_PUBLIC_APP_URL` and `CHIA_MAIL_ENABLED`. Follow [email runbook](email-delivery.md); Next environment files do not configure PocketBase automatically.
11. Owner fills dashboard settings. Visitor counts default off; optional analytics activation requires the owner's privacy/consent review. Counts are approximate browsers, not verified people.

## Acceptance evidence before hoster handover

Record release commit, runtime versions, target URLs, date, operator and pass/fail results. Required journeys: guest/account purchase, invalid/expired payment, webhook replay, concurrent stock reservation, cancellation/refund, shipment, guest receipt access/expiry, login/reset/verification, admin permissions, contact delivery, mobile/keyboard browsing and missing-service recovery. Provider tests must use real sandbox services, not only mocked tests.

## Backup and restore drill

Back up PocketBase's supported database/file snapshot plus encrypted credential file and required protected configuration. Keep encryption keys separately accessible to authorized recovery operators. Do not copy active SQLite files blindly. If using filesystem copies, stop PocketBase first; include all data/files and required WAL state. Define retention and off-server encryption with the owner.

Restore into a separate private instance with outbound email/payment actions disabled, the matching release/binary, and isolated URLs. Verify catalog/images, accounts/permissions, saved orders, stock and decryption. Document elapsed recovery time and missing data. Never connect a restored test worker to live mail or production Stripe.

## Updates and rollback

Before business-data migrations: maintenance plan, verified backup, exact migration set and reviewed schema compatibility. Many migrations intentionally reject rollback; reverting code alone is not a safe rollback. Restore a matched release/data backup or apply a corrective migration. Reconcile payment/provider activity occurring after the backup before resuming orders. Preserve data/credentials across release-directory replacement.

## Support triage

- App startup failure: inspect required origins, backend service credentials and encrypted store readability; do not log secrets.
- Authentication/contact returns 429 during dependency outage: check Redis and trusted ingress configuration.
- Missing receipt: Admin > Settings > Email delivery status, SMTP logs, blocked/failed/uncertain state. Follow retry instructions.
- Pending payment: inspect signed webhook delivery and saved session/amount binding; never manually mark paid without the supported reconciliation procedure.
- Visitor counts: check admin switch and browser opt-out; one browser/day, no private routes. Browser clearing/bots can affect figures.

Fresh-install verification on the owner's VPS and an automated synthetic offline restore rehearsal are documented in [VPS evidence](vps-verification.md). These checks do not replace actual HTTPS staging deployment, provider integration checks or a restore drill using the deployed backup system.

Blog body uploads also need persistent storage: preserve `public/blog-images/` and legacy `public/blog/` across releases and include them in backups. These files are separate from PocketBase cover images. See [handover checklist](../HANDOVER.md).
