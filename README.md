# Chia Charged storefront

Next.js storefront and admin dashboard backed by PocketBase, Stripe card payments and Redis rate limits. US delivery; USD catalog; admin-managed shipping and first-order discount.

**Status:** local development/verification. Not approved for public production. Complete local acceptance, then test on the owner's VPS, then hand the verified release to the business hoster. No live credentials or business database are included.

## Local preview

Use Node **22.23.2** (`.nvmrc`) and npm. PocketBase **0.31.0** is the pinned tested backend; installer supports Windows/Linux x64.

```sh
npm ci
npm run setup:backend
npm run preview:local
```

Open the URL printed by the launcher (normally http://127.0.0.1:3100). Preview uses an isolated synthetic database under `.local-preview/`, demo products, and no live payment/email configuration. See [preview accounts and instructions](docs/local-preview.md). Never point test/preview tools at business data.

## Checks

```sh
npm test
npm run lint
npm run build:check
```

`npm test` exercises disposable PocketBase instances and mocked provider boundaries. `lint` rejects new findings against recorded historical debt; it does **not** mean full lint is clean. `build:check` uses synthetic configuration and is not the deployable production build. Real SMTP, Stripe and Redis integration require staging checks.

## Architecture

For a fresh **disposable Linux x64 checkout**, run `bash scripts/verify-linux.sh` as a non-root user. It downloads a checksum-verified, temporary pinned Node runtime and runs installation, backend setup, dependency audit, lint, tests and build verification. Requires `curl`, `tar`, `sha256sum` and `unzip`. It refuses checkout environment files and does not replace system Node or configure production services.

- `src/app/`: storefront, admin, API routes; canonical products under `/product/[slug]`.
- `src/lib/`: pricing, session authorization, encrypted credential storage, configuration and shared validation.
- `backend/pb_migrations/`: versioned schema/security changes; many intentionally forward-only.
- `backend/pb_hooks/`: atomic stock/order/refund operations, notification worker, visit retention.
- `tests/`: isolated integration and runtime tests. `scripts/`: installer, preview and verification tools.
- PocketBase persists customer/catalog/order data and images. Next runs with a private backend service account. Browser permissions remain restricted independently of dashboard visibility.
- Stripe signed webhooks establish paid state; fulfillment and refunds have separate audited transitions.
- Redis is required for production rate-limited routes. Protected requests are denied during Redis failure.

## Configuration and startup

[`.env.example`](.env.example) lists required settings without secrets. Public URLs are build-time configuration: rebuild after changing them. Use `npm run build` with actual target configuration, then `npm start` behind HTTPS ingress. Start PocketBase separately with the versioned hooks/migrations and a persistent data directory. Detailed sequence: [hoster runbook](docs/hoster-handover.md).

Encrypted provider credentials live outside the release folder. With `OAUTH_ENCRYPTION_KEY` securely loaded, initialize a **new** private file using `node scripts/provision-credentials.cjs init ABSOLUTE_DESTINATION`. Never overwrite an existing credential store or lose its encryption key. [Credential operations](docs/step-3-credentials.md).

## Owner and operator guides

- [Owner dashboard setup](docs/owner-setup.md): products, labels, policies, discounts, testimonials.
- [Email delivery](docs/email-delivery.md): SMTP worker, retries, guest links and recovery.
- [Runtime safety](docs/runtime-safety.md): Redis, trusted ingress and retention.
- [Hoster handover and launch gates](docs/hoster-handover.md).
- [Remaining plan](docs/production-readiness-plan.md) and [implementation progress](docs/production-readiness-progress.md). Earlier step reports are historical; later progress entries supersede them.

## Release exclusions

Do not ship `.env.local`, private keys, `secrets/`, `.local-preview/`, `.local-tools/`, `backend/pb_data/`, or `node_modules/`. Include source, lockfile, migrations, hooks, tests and documentation. Transfer runtime secrets separately through a secure channel. Do not publish customer data in the repository.

## Outstanding release gates

Clean-install/VPS verification, actual payment/email/Redis tests, backup restoration, monitoring, performance review and mobile/accessibility acceptance remain required. Existing lint/type-looseness debt is documented, not waived. Owner confirms product facts, quoted testimonials and legal/business text before activation.
