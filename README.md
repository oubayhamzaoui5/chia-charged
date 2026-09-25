# Chia Charged — installation and operating guide

Next.js storefront and owner dashboard, backed by PocketBase, Stripe card payments and Redis. USD orders, US delivery, dashboard-managed shipping, discounts, products, policies, articles and testimonials.

Follow this guide in order to install and operate the store without developer assistance. Examples target **Ubuntu Linux x64 with systemd and Nginx**. Replace example domains, account names and paths. On a shared server choose unused ports/service names and preserve other websites' configuration.

## 1. Prepare access

Obtain server SSH/sudo access; website and backend domains with DNS access; business Stripe account; SMTP credentials and verified sender; owner email; encrypted off-server backup destination; and a maintenance/monitoring contact.

Use **Node 22.23.2** (`.nvmrc`) and **PocketBase 0.31.0**. Use durable writable storage and long-running services, not an ephemeral/serverless filesystem. Example domains are `store.example.com` and `data.example.com`.

Three separate accounts are involved:

| Account | Purpose |
|---|---|
| Linux service user `chia` | Runs processes without sudo privileges |
| PocketBase superuser | Backend service/operator access; credentials configure Next.js |
| Website admin in `users` | Owner signs in at `/login`, then opens `/admin` |

A PocketBase superuser is **not** the owner's website login. No default production admin/password is included.

## 2. Install runtime and source

Run as server administrator on a fresh installation:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git unzip xz-utils nginx redis-server openssl
sudo useradd --system --create-home --home-dir /var/lib/chia-charged --shell /usr/sbin/nologin chia
sudo install -d -o chia -g chia -m 0750 /opt/chia-charged
sudo install -d -o chia -g chia -m 0700 /var/lib/chia-charged/pb_data /var/lib/chia-charged/secrets
sudo install -d -o chia -g chia -m 0750 /var/lib/chia-charged/blog-images /var/lib/chia-charged/blog
sudo install -d -o root -g chia -m 0750 /etc/chia-charged
sudo -u chia git clone https://github.com/oubayhamzaoui5/chia-charged.git /opt/chia-charged/app
```

Select the supplied commit using `sudo -u chia git -C /opt/chia-charged/app checkout RELEASE_COMMIT`. Record it for recovery. Alternatively extract the source ZIP there and assign ownership to `chia`.

Install pinned Node without replacing system Node:

```bash
cd /tmp
curl -fsSLO https://nodejs.org/dist/v22.23.2/node-v22.23.2-linux-x64.tar.xz
curl -fsSLO https://nodejs.org/dist/v22.23.2/SHASUMS256.txt
grep '  node-v22.23.2-linux-x64.tar.xz$' SHASUMS256.txt | sha256sum --check --strict
sudo tar -xJf node-v22.23.2-linux-x64.tar.xz -C /opt
cd /opt/chia-charged/app
sudo -u chia env PATH=/opt/node-v22.23.2-linux-x64/bin:/usr/bin:/bin npm ci
sudo -u chia env PATH=/opt/node-v22.23.2-linux-x64/bin:/usr/bin:/bin npm run setup:backend
```

Stop if checksum verification fails. The backend installer also verifies its pinned binary. Its path is `.local-tools/pocketbase/pocketbase`.

On a fresh checkout, link blog body uploads to persistent storage:

```bash
sudo -u chia ln -s /var/lib/chia-charged/blog-images public/blog-images
sudo -u chia ln -s /var/lib/chia-charged/blog public/blog
```

If these paths already contain files, preserve/copy them into persistent storage before linking. Never overwrite uploads. PocketBase cover images live separately in `pb_data`.

## 3. Configure Redis

Use a dedicated private instance or managed Redis. For a fresh single-store Ubuntu instance, edit `/etc/redis/redis.conf`: loopback binding, `protected-mode yes`, and a strong `requirepass`. Generate a password using `openssl rand -hex 32`; store it securely. Do not change a shared instance without checking other clients.

```bash
sudo systemctl enable --now redis-server
sudo systemctl restart redis-server
redis-cli --askpass ping
```

Expected: `PONG`. Configure `REDIS_URL=redis://:PASSWORD@127.0.0.1:6379` later. Hex passwords need no URL escaping; other passwords must be URL-encoded. Managed TLS services use `rediss://`. Keep port 6379 private.

Production protected actions deny requests during Redis failure. A working homepage alone does not verify authentication/contact functionality.

## 4. Initialize PocketBase and backend access

For a **new empty** database:

```bash
cd /opt/chia-charged/app
sudo -u chia .local-tools/pocketbase/pocketbase migrate up \
  --dir=/var/lib/chia-charged/pb_data \
  --migrationsDir=/opt/chia-charged/app/backend/pb_migrations \
  --hooksDir=/opt/chia-charged/app/backend/pb_hooks
```

Both migration and hook directories are required. Ship complete hooks including `blog-seed/`. Migrations install schema, settings and three starter articles. **They do not create the owner account or a complete sale-ready catalog.** Preview products/accounts are separate demo data. Existing databases require backup and the update procedure below.

### Create a backend service superuser

Use a dedicated email/password, saved in the business password manager. Run in Bash with tracing disabled; hidden input keeps literal passwords out of shell history. PocketBase's CLI passes the password as a process argument, so use this on the controlled server before starting the service.

```bash
read -r -p 'Backend service email: ' CHIA_SERVICE_EMAIL
read -r -s -p 'Backend service password: ' CHIA_SERVICE_PASSWORD
printf '\n'
sudo -u chia /opt/chia-charged/app/.local-tools/pocketbase/pocketbase superuser create \
  "$CHIA_SERVICE_EMAIL" "$CHIA_SERVICE_PASSWORD" \
  --dir=/var/lib/chia-charged/pb_data \
  --migrationsDir=/opt/chia-charged/app/backend/pb_migrations \
  --hooksDir=/opt/chia-charged/app/backend/pb_hooks
unset CHIA_SERVICE_EMAIL CHIA_SERVICE_PASSWORD
```

Keep these credentials for `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD`. A separate operator superuser can be used for routine administration. [PocketBase operator reference](https://pocketbase.io/docs/going-to-production/).

### Start the backend service

Create `/etc/chia-charged/pocketbase.env`, owned by `root:chia`, permission `640`:

```dotenv
CHIA_MAIL_ENABLED=false
CHIA_PUBLIC_APP_URL=https://store.example.com
```

Create `/etc/systemd/system/chia-pocketbase.service`:

```ini
[Unit]
Description=Chia Charged PocketBase
After=network.target

[Service]
User=chia
Group=chia
WorkingDirectory=/opt/chia-charged/app
EnvironmentFile=/etc/chia-charged/pocketbase.env
ExecStart=/opt/chia-charged/app/.local-tools/pocketbase/pocketbase serve --http=127.0.0.1:8090 --automigrate=false --hooksWatch=false --dir=/var/lib/chia-charged/pb_data --migrationsDir=/opt/chia-charged/app/backend/pb_migrations --hooksDir=/opt/chia-charged/app/backend/pb_hooks
Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now chia-pocketbase
curl --fail http://127.0.0.1:8090/api/health
```

Expected HTTP 200. Keep port 8090 private.

## 5. Create the owner's website administrator

From the operator's computer:

```bash
ssh -N -L 8091:127.0.0.1:8090 SSH_USER@SERVER_IP
```

Keep the tunnel open. Visit **http://127.0.0.1:8091/_/** and sign in with the backend superuser.

1. Open **Collections → users → New record**.
2. Enter owner's email, a strong unique password and password confirmation.
3. Fill `name` and `surname`.
4. Set fields explicitly:

| Field | Value |
|---|---|
| `role` | `admin` |
| `isActive` | `true` |
| `canManageAdmins` | `true` for the primary owner |
| `verified` | `true` after confirming ownership of the supplied email |

5. Save. `verified` is PocketBase's built-in email flag; legacy `verif` is not a substitute.
6. After starting the website, sign in at `https://store.example.com/login` using this **users account**, then visit `/admin`.
7. Verify Products, Orders, Settings, API Keys and Admins. Create subsequent admins through **Admin → Admins**, limiting administrator-management capability to authorized managers.

Public signup creates customers. Do not relax database rules to create admins. Transfer owner credentials securely; the owner can change their password in Settings.

## 6. Configure website environment and encrypted storage

Copy `.env.example` to `/etc/chia-charged/web.env`, owned by `root:chia`, mode `640`. Edit securely. Use `KEY=value`, quote special characters, no `export` statements; syntax must work with Node's environment-file parser and systemd. Never commit populated environment files.

| Variable | Value |
|---|---|
| `NODE_ENV` | Add `production` |
| `APP_URL` | `https://store.example.com`, no path |
| `NEXT_PUBLIC_SITE_URL` | Exactly the same origin as `APP_URL` |
| `POCKETBASE_URL` | `http://127.0.0.1:8090` in this layout |
| `NEXT_PUBLIC_PB_URL` | `https://data.example.com` |
| `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD` | Backend service superuser credentials |
| `OAUTH_ENCRYPTION_KEY` | 64 hex characters generated with `openssl rand -hex 32` |
| `CREDENTIALS_FILE` | `/var/lib/chia-charged/secrets/oauth.enc.json` |
| `REDIS_URL` | Authenticated private Redis URL |
| `TRUST_PROXY_HEADERS` | `true` only after trusted ingress replaces headers and direct access is blocked |
| `STRIPE_WEBHOOK_SECRET` | Signing secret; import into encrypted storage in step 9 |

`CHIA_MAIL_ENABLED` / `CHIA_PUBLIC_APP_URL` belong in **PocketBase's environment**, not just Next's. Leave push variables empty unless configuring push. Google login, Meta and push are optional.

Initialize a **new** credential store once:

```bash
cd /opt/chia-charged/app
sudo -u chia /opt/node-v22.23.2-linux-x64/bin/node --env-file=/etc/chia-charged/web.env \
  scripts/provision-credentials.cjs init /var/lib/chia-charged/secrets/oauth.enc.json
```

Expected: `Encrypted credential file prepared and verified`. Existing destinations are refused. Preserve original file/key on updates. Losing the key makes stored credentials unreadable; back it up separately. [Migration/key rotation](docs/step-3-credentials.md).

## 7. Set up domains, HTTPS and ingress

Point both DNS names at the host, obtain TLS certificates through the host's certificate automation, enable renewal and redirect HTTP to HTTPS. Permit web traffic and authorized SSH, keeping raw app/backend/Redis ports private. Preserve shared-server firewall rules. Verify externally from another computer.

Create `/etc/nginx/sites-available/chia-charged` with two `server` blocks, initially `listen 80;`, one `server_name store.example.com;`, the other `server_name data.example.com;`. Put the respective location blocks below inside them. Then enable the site and provision HTTPS:

```bash
sudo ln -s /etc/nginx/sites-available/chia-charged /etc/nginx/sites-enabled/chia-charged
sudo nginx -t
sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d store.example.com -d data.example.com --redirect
sudo certbot renew --dry-run
```

Use actual domains and business renewal contact when prompted. DNS must already resolve and port 80 must be reachable for this certificate workflow. Certbot adds certificate configuration and HTTPS redirects; inspect the resulting two virtual hosts. Existing hosting-managed TLS can replace this certificate step.

Website host:

```nginx
client_max_body_size 25m;
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_buffering off;
    proxy_read_timeout 120s;
}
```

Backend host:

```nginx
client_max_body_size 25m;
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $remote_addr;
location = /api/collections/_superusers { return 403; }
location ^~ /api/collections/_superusers/ { return 403; }
location = /api/collections/pbc_3142635823 { return 403; }
location ^~ /api/collections/pbc_3142635823/ { return 403; }
location /api/collections/ { proxy_pass http://127.0.0.1:8090; }
location /api/files/ { proxy_pass http://127.0.0.1:8090; }
location = /api/oauth2-redirect { proxy_pass http://127.0.0.1:8090; }
location /api/realtime {
    proxy_pass http://127.0.0.1:8090;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_read_timeout 3600s;
}
location /_/ { proxy_pass http://127.0.0.1:8090; }
location / { return 403; }
```

Reload only after `sudo nginx -t` succeeds. Both the superuser collection name and its pinned-version ID are blocked; retain both rules. Keep collection permissions intact. Operator settings, schema-list and backup APIs remain private; use the SSH tunnel.

**Confirmation pages:** built-in verification/email-change pages use `/_/#/auth/...`. Fragments never reach Nginx, so it cannot allow only the auth fragment. This example allows the UI shell while blocking public superuser authentication. If your policy requires that shell private, provide/test separate public confirmation pages; simply blocking `/_/` breaks default email links.

With a CDN/additional proxy, restore client IP only from trusted provider ranges before forwarding `$remote_addr`. Never trust arbitrary incoming forwarded headers. Bind app/backend to loopback.

Public backend file URLs must resolve over HTTPS from the website process too. Production image optimization rejects private/loopback destinations; do not substitute localhost for the public backend domain.

## 8. Build and start the website

```bash
cd /opt/chia-charged/app
sudo -u chia /opt/node-v22.23.2-linux-x64/bin/node --env-file=/etc/chia-charged/web.env node_modules/next/dist/bin/next build
```

Create `/etc/systemd/system/chia-web.service`:

```ini
[Unit]
Description=Chia Charged website
After=network.target chia-pocketbase.service redis-server.service
Wants=chia-pocketbase.service

[Service]
User=chia
Group=chia
WorkingDirectory=/opt/chia-charged/app
EnvironmentFile=/etc/chia-charged/web.env
Environment=NODE_ENV=production
ExecStart=/opt/node-v22.23.2-linux-x64/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
Restart=on-failure
RestartSec=5
UMask=0027
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now chia-web
sudo systemctl status chia-web chia-pocketbase redis-server --no-pager
curl --fail https://store.example.com/
```

Rebuild/restart after changing public URLs: these are compiled into browser assets. Restart affected services after server-only environment changes. Do not deploy `next dev`, local preview or synthetic `build:check` output.

## 9. Connect Stripe

1. Sign in as owner; **Admin → API Keys**: save matching Stripe **test-mode** publishable and secret keys.
2. Create Stripe test webhook endpoint `https://store.example.com/api/shop/stripe/webhook`.
3. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`.
4. Put endpoint signing secret `whsec_...` in protected `web.env` as `STRIPE_WEBHOOK_SECRET`.
5. Import it into encrypted storage below. **Environment alone is insufficient:** the webhook handler reads encrypted storage; the dashboard saves API keys, not this signing secret.

```bash
cd /opt/chia-charged/app
sudo -u chia /opt/node-v22.23.2-linux-x64/bin/node --env-file=/etc/chia-charged/web.env -e '
const secret = process.env.STRIPE_WEBHOOK_SECRET;
if (!secret || !secret.startsWith("whsec_")) throw new Error("Set endpoint signing secret first");
require("./src/lib/credential-store.cjs").mergeKeys({stripeWebhookSecret: secret});
console.log("Webhook secret stored");'
```

This preserves other keys. Repeat when rotating/changing endpoint modes. Removing Stripe through the dashboard removes its stored signing secret too.

6. Configure Stripe Tax with business address and registrations. Checkout requests automatic tax, not a fixed nationwide US rate. This release explicitly sends product tax code `txcd_40060003`, shipping code `txcd_92010001`, and exclusive tax pricing in `src/app/api/shop/stripe/checkout/route.ts`; changing Stripe's default product code does not override these explicit values. Owner confirms their suitability for the actual products; a different classification requires updating those constants and retesting. [Stripe Tax setup](https://docs.stripe.com/tax/set-up).
7. Add approved products/stock; test guest and signed-in purchases. Check successful webhook delivery, paid status, matching amounts and stock changing once. A fabricated event with an unknown session is not a purchase test.
8. Test cancellation/expiry, webhook retry and refund through Admin → Orders. Confirm provider/dashboard agreement; never manually mark an unpaid order paid.
9. After sandbox acceptance, save matching live keys, create live endpoint, import its separate secret and verify configuration. Keep staging and business datasets separate.

Cards only; no cash-on-delivery fallback. Missing configuration disables checkout. [Stripe testing](https://docs.stripe.com/testing).

## 10. Configure email

Through private PocketBase administration:

1. Configure application name, sender name/address, SMTP host/port, credentials and TLS per provider.
2. Verify sender/domain and configure required DNS records.
3. In **users auth collection email templates**, edit the button's `href` in each HTML body to the URL below, preserving `{TOKEN}`. PocketBase 0.31 stores these links in the template body, not a separate `actionUrl` field:

| Email | Action URL |
|---|---|
| Reset | `https://store.example.com/reset-password?token={TOKEN}` |
| Verification | `https://data.example.com/_/#/auth/confirm-verification/{TOKEN}` |
| Email change | `https://data.example.com/_/#/auth/confirm-email-change/{TOKEN}` |

4. Replace the old `{APP_URL}/_/#/auth/...` link where necessary; do not leave it pointing to the storefront's nonexistent PocketBase UI. Test verification/reset/email change in approved inboxes; confirm resulting account state/login.
5. Website **Admin → Settings**: enter public Support email recipient.
6. Set correct `CHIA_PUBLIC_APP_URL` and `CHIA_MAIL_ENABLED=true` in **pocketbase.env**; restart `chia-pocketbase`.
7. Test contact, itemized receipt, shipment/refund emails and guest links. Guest links expire after seven days.

Worker runs every minute inside PocketBase; no separate worker service. Its switch does **not** disable native account mail; use provider-level sandbox recipients during staging. **Admin → Settings → View email delivery status** shows jobs. `sent` means SMTP acceptance, not inbox delivery. Inspect provider logs before retrying uncertain jobs. [Retry/recovery guide](docs/email-delivery.md).

## 11. Complete owner settings

| Dashboard | Work |
|---|---|
| Categories / Products | Real catalog/images, USD prices, visibility and stock |
| Product labels | Ingredients, allergens, flavor-specific nutrition from current packaging |
| US Shipping | Flat rate per order; `0` = free shipping |
| Store settings | Business identity/address, support email, shipping/returns/privacy/terms, storage/preparation |
| First-order discount | Enable/disable and percentage; email verification must work |
| Social profiles | Full HTTPS links; blank profiles hidden |
| Testimonials / ratings | Approve/edit quotes, images, counts and verified badges |
| Blog | Review/edit/unpublish starter articles and image claims |
| Orders | Rehearse fulfillment, tracking and refunds |

For original flavors preserve slugs `strawberries-n-cream-cc-str-4` and `chocolate-chip-cc-chklt-4`; verify homepage/footer links. Do not use demo stock/prices/accounts as business data.

Original articles/testimonials were retained by request; some claims conflict with whey/milk or sugar information. Owner must approve/correct them. Counts/verified badges are editorial values, not automatic purchase verification. Visitor counts default off; complete privacy review before enabling.

Starter articles install automatically, preserving matches by slug/title, including unpublished posts. Restarts do not recreate deleted posts after migration completion. Existing databases needing only missing articles can use `scripts/seed-posts.cjs` with explicit backend URL/service credentials in a protected environment.

## 12. Backups, monitoring and updates

Back up complete PocketBase data/uploads; encrypted credential file; separate encryption key; blog body uploads; protected environment and service/proxy configuration; and release/runtime identifiers.

Schedule encrypted off-server backups with retention/failure alerts. PocketBase backup alone excludes Next's body images and separate credentials. Do not copy active SQLite files blindly. For offline copies, stop both app services during maintenance, copy complete state, restart and verify health.

Rehearse restoration privately with matching code/runtime, provider activity disabled and sandbox SMTP. Custom worker switch alone does not disable account mail. Verify orders, stock, images, permissions and credential decryption; record recovery time.

Monitor HTTPS health, restarts, Redis failures, webhooks, failed/uncertain mail, disk capacity, certificate expiry and backup age. Restrict logs to operators; never publish secrets/customer data.

```bash
sudo journalctl -u chia-web -n 100 --no-pager
sudo journalctl -u chia-pocketbase -n 100 --no-pager
sudo systemctl status chia-web chia-pocketbase redis-server --no-pager
curl --fail http://127.0.0.1:8090/api/health
```

### Update procedure

1. Record current release/configuration; verify recoverable backup.
2. Rehearse migrations in an isolated restored copy with external activity disabled.
3. During maintenance stop both services; deploy chosen source, `npm ci`, pinned backend, all hooks/migrations.
4. Preserve persistent data/key/credentials and recreate upload links for new release directories.
5. Apply explicit `migrate up` from step 4; start PocketBase.
6. Build with actual environment; start Next, check health/login/images/checkout, then reopen traffic.
7. Many migrations are forward-only. Code rollback alone may be unsafe: restore matched data/code or apply a corrective migration. Reconcile provider activity since backup before resuming sales.

## 13. Verification and launch checklist

In a disposable checkout with pinned runtime:

```bash
npm ci
npm run setup:backend
npm audit --audit-level=high
npm run lint
npm test
REDIS_TEST_BINARY=/usr/bin/redis-server npm run test:redis
npm run build:check
```

Alternatively `bash scripts/verify-linux.sh` automates Linux x64 checks as non-root; set `REDIS_TEST_BINARY` to include Redis. Tests use disposable databases. Rebuild with real environment for deployment. Coverage includes payment mocks, permissions, inventory concurrency, blog installation, local SMTP, restore and Redis recovery. Lint prevents new findings against historical debt; `npm run lint:full` shows all findings. [Recorded evidence](docs/vps-verification.md).

Record deployment commit/date/operator and results:

- [ ] External HTTPS works; direct ports/operator APIs are private.
- [ ] Owner login works; customers cannot perform admin actions.
- [ ] Real products/images, blog, policies and mobile checkout display correctly.
- [ ] Guest/customer sandbox purchases, cancellations, retry and refund reconcile.
- [ ] Shipping/discount/tax/totals/stock match provider and saved order.
- [ ] Account/support/receipt/shipment emails reach inboxes with working links.
- [ ] Services recover after reboot; Redis outage/recovery works.
- [ ] Scheduled encrypted off-server backup and separate restore succeed.
- [ ] Monitoring reaches named operator; owner approves public content.
- [ ] Live keys/endpoint configured after sandbox acceptance; demo data excluded.

## 14. Troubleshooting

| Symptom | Checks / remedy |
|---|---|
| Nginx 502 | Service logs, correct port, successful build, readable environment |
| Startup configuration error | HTTPS origins, matching app/site URLs, explicit backend URL, service login and encrypted-file/key pair |
| Owner login fails | Use `users`, not `_superusers`; password, `role=admin`, `isActive=true`, correct database and Redis |
| Cannot manage admins | Authorized owner needs `canManageAdmins=true` |
| Unexpected 429 | Redis/password, actual limits, trusted IP configuration; do not disable protection |
| Payments unavailable | Matching API keys, readable credential file |
| Webhook 503/signature error | Import signing secret; check endpoint mode, clock and unchanged request body |
| Stripe paid, website pending | Legitimate webhook delivery/session binding; retry failed delivery, never fabricate paid state |
| Broken product images | Public backend DNS/HTTPS/file route, build-time URL, uploads and public image destination |
| Missing blog images | Persistent body-upload links/files/permissions |
| Broken email links | Template URL, expiry, public confirmation shell/routes |
| Notifications blocked | SMTP/sender/support recipient/PocketBase process environment |
| Cannot decrypt credentials | Restore matching key/file; never initialize over existing storage |
| Credential file busy | Stop writers, investigate process/lock; do not remove an active writer's lock |
| Forgotten owner password | Reset email, or private operator reset of owner's `users` password |

## Local preview and delivery contents

Local Windows/Linux x64: `npm ci`, `npm run setup:backend`, `npm run preview:local`. Open printed URL, normally `http://127.0.0.1:3100`. [Demo accounts/instructions](docs/local-preview.md). Preview uses synthetic data with no real payment setup.

Deliver source, lockfile, migrations, hooks/bundled images, tests and documentation. Exclude populated environment files, private keys, runtime databases, `secrets`, `.local-preview`, `.local-tools`, `.next` and `node_modules`. Transfer required credentials/business backups separately through a secure channel.

Give the business release identifier, admin access, host/provider account ownership, recovery details and maintenance contact. References: [handover checklist](HANDOVER.md), [email operations](docs/email-delivery.md), [runtime safety](docs/runtime-safety.md), [owner settings](docs/owner-setup.md). Historical step reports are supporting records; this README is the installation entry point.
