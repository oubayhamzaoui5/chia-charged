# Step 3: credentials and configuration

Local implementation, 16 September 2026. Production domain/host remains undecided. Existing credentials, environment file and business databases were not changed. No deployment.

## Implemented

- Removed source-code encryption fallback. Application requires a 32-byte encryption key supplied as 64 hexadecimal characters in `OAUTH_ENCRYPTION_KEY`.
- Versioned AES-256-GCM credential file, authenticated metadata, random nonce on each write. Missing keys, legacy files, damaged files and unreadable production storage fail explicitly.
- Provider updates use a cross-process lock and atomic file replacement. A failed read cannot silently overwrite existing credentials. A stale lock requires operator recovery with writers stopped.
- Removing Google preserves Stripe and Meta. Google configuration now updates the users collection's actual OAuth provider configuration. Other OAuth providers and their stored secrets are preserved in integration tests.
- Stripe keys must have matching test/live modes. Removing Stripe removes its stored webhook secret too. Environment-supplied webhook secrets must be managed separately by the operator.
- Missing Stripe configuration blocks checkout before order creation. Removed successful test-order fallback and its checkout UI. This part of Step 5 was brought forward because missing credentials must fail closed.
- Startup validates required configuration and encrypted storage. Public production URLs require HTTPS. Backend HTTP is allowed only on loopback; remote backends require HTTPS. Server backend URL must be explicit in production.
- Session cookies always use Secure in production, plus HttpOnly and SameSite=Lax. Checkout/OAuth return URLs use configured canonical origin rather than request host headers.
- Server PocketBase clients reject redirects to prevent resending credential-bearing requests. Forwarded client-IP headers are ignored unless explicitly trusted.

## Required configuration

| Setting | Operator supplies |
|---|---|
| APP_URL | Canonical website HTTPS origin |
| NEXT_PUBLIC_SITE_URL | Same canonical origin |
| NEXT_PUBLIC_PB_URL | Public backend HTTPS origin; compiled into browser build |
| POCKETBASE_URL | Server backend HTTPS origin, or same-host loopback HTTP origin |
| PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD | Backend service account credentials, injected server-side |
| OAUTH_ENCRYPTION_KEY | Random 32-byte key, hex encoded; keep outside repository and encrypted file |
| CREDENTIALS_FILE | Absolute path to private persistent storage, independent of release directory |
| TRUST_PROXY_HEADERS | Default false; true only when trusted ingress replaces headers and direct access is blocked |

Do not use temporary/serverless filesystem storage for dashboard-managed credentials. Current implementation needs one durable shared filesystem with reliable exclusive locks and atomic rename. Different independent instance files are unsupported. On Windows, configure directory ACLs for the service account; POSIX file modes alone do not establish Windows access control. Keep storage outside public/static directories and protect parent directories.

The application's encrypted file does not replace PocketBase's own provider configuration storage. Protect backend database volumes, backups and service credentials as well.

## Offline provisioning and migration

Tool: `node scripts/provision-credentials.cjs`.

- New installation: `init ABSOLUTE_DESTINATION` creates an empty encrypted store.
- Existing installation: `migrate ABSOLUTE_SOURCE ABSOLUTE_DESTINATION` preserves source and refuses existing destinations.
- Supply new `OAUTH_ENCRYPTION_KEY` through the operator's secure environment.
- For legacy migration, also supply the original passphrase as `LEGACY_OAUTH_ENCRYPTION_KEY`. Only the offline tool understands the legacy format; runtime has no fallback.
- For later key rotation, supply old hex key as `PREVIOUS_OAUTH_ENCRYPTION_KEY` and new key as `OAUTH_ENCRYPTION_KEY`.
- Migration verifies the new file can decrypt. No keys or decrypted content are logged. Legacy source remains intact for reviewed recovery; secure it and remove it through the agreed retention procedure after successful activation.

Stop credential writers before provisioning/rotation. Back up source and configuration securely. Switch runtime key and file path together, restart, and verify provider status. Do not roll back to the insecure runtime. If encrypted files were exposed alongside the old source fallback, rotate affected provider secrets; re-encryption cannot revoke previously copied secrets. Existing database permissions and HTTP exposure also need review when choosing service-credential rotation.

Actual stored credentials have NOT been migrated. Current `.env.local` lacks the new key/storage configuration and contains the previously identified HTTP configuration. Normal startup is intentionally blocked until configured; automated tests use isolated synthetic configuration. Do not copy the production-build fixture origins into a real deployment.

## Verification and limits

- Eight credential/configuration integration scenarios passed: missing keys, encryption, corruption, lock contention, legacy migration/key rotation, provider isolation, admin checks, absent Stripe configuration, production URL/storage validation, forged host headers and Secure cookies.
- Thirteen database/security scenarios and eight shipping scenarios also passed: 29 scenarios total, excluding suite wrapper entries.
- TypeScript and production build passed. Build used synthetic configuration; see `step-3-build.log`. This validates compilation, not a chosen deployment or working external provider.
- PocketBase tests use temporary data/hooks and disable migration generation. The test-only provider-secret probe is never copied into release hooks.
- Browser acceptance, real HTTPS ingress, live Google/Stripe credentials and actual credential migration remain unverified until an isolated staging target is prepared.
- Lint/dependency issues remain Step 4. Payment signatures, accurate paid status and stock concurrency remain Steps 5-7. Public launch is still blocked.

## Low-token collaboration

Owner preference: brief updates, one bounded step per approval, no repeated passing checks without a reason.

Agent handles code, migrations and security checks. Owner can handle browser acceptance once an isolated preview is configured:

1. Sign in/out; confirm account persists after refresh.
2. Save/remove Google settings using staging credentials; confirm Stripe remains configured.
3. Remove staging Stripe settings; confirm checkout says payments unavailable and cannot submit.
4. Restore staging Stripe settings; confirm payment button returns.
5. Check shipping on phone/desktop; report page, action, expected result and actual result.

These are staging tasks, not instructions to alter live credentials. No browser testing needed against the current unconfigured environment. Future automated test commands: `npm run test:credentials`, `npm run test:security`, `npm run test:shipping`. Send only failing output when requesting help.

Next proposed step: repair dependency/lint/build gates and version backend release inputs. Await owner approval.
