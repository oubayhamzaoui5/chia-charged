# Chia Charged — remaining production-readiness plan

Updated: 21 September 2026.

## Current status and working agreement

- **Steps 1-10 are implemented and verified locally.** Step 10 adds forward-only fulfillment, tracking, Stripe refunds, conservative restocking, immutable order events, and archiving; see [Step 10 review](step-10-order-operations.md). No business database migrated or public deployment performed.
- **Step 11 local foundation is implemented.** Contact messages and deduplicated notification jobs persist with visible blocked/failure state; see [Step 11 foundation](step-11-notifications-foundation.md). Actual delivery awaits sender domain, provider credentials, approved recipients, and final URLs.
- **Step 12 requires owner-approved product facts, offers, business identity, and policies.** These cannot be derived safely from code.
- Local review approval does not authorize live activation, business-data migration, or public deployment.
- Continue safe local implementation automatically. Live activation, external messages, business-data migration, and public deployment still require exact production inputs and explicit approval.
- Approval of local implementation is separate from activation against real customer data or public deployment. Identify the target and prepare backup/rollback before requesting activation approval.
- Keep changes staged locally or in an isolated staging environment until the combined release passes its launch gates. Do not expose an intermediate checkout while critical security/payment issues remain.
- US delivery only. Shop and wishlist are retired pages: remove stale references rather than rebuilding them. Other legacy features should be checked against the intended launch scope.

For completed shipping behavior and activation details, see [approval log](production-readiness-progress.md). The original audit remains a historical baseline; this plan tracks subsequent work.

## Ordered implementation steps

### Step 2 — close database access and protect business operations

**Purpose:** prevent anonymous administration, customer-data exposure, price changes, and record deletion.

Work:
- Map anonymous, customer, admin, and backend-service permissions for every collection.
- Protect user roles and account flags; customer A must never access customer B's records.
- Limit public reads to intended published catalog/configuration data and safe fields.
- Move order/stock mutations behind a trusted backend boundary as permissions close, so checkout does not depend on public product/order writes.
- Restrict push subscriptions, internal inventory, configuration, and uploaded files appropriately.
- Close the guest-order detail exception; use scoped access credentials, not an order ID alone. Complete the guest experience in Step 8.
- Check active admin reporting/services that currently rely on anonymous database reads.

**Done when:** direct backend tests prove anonymous/customer isolation, role protection, and denied business mutations; authorized admin and retained checkout flows still function. Shipping action cannot be reached through self-promotion to admin.

### Step 3 — secure credentials, backend transport, and configuration

**Purpose:** protect secrets and eliminate unsafe production fallbacks.

Work:
- Require a deployment-managed encryption key; replace the source-code fallback and re-encrypt stored credentials.
- Separate provider configuration so removing Google credentials cannot remove Stripe credentials.
- Define durable credential storage and validate required configuration at startup.
- Configure a private or HTTPS backend connection, canonical app URL, trusted proxy headers, and consistently secure session cookies.
- Document which credentials must be rotated if prior storage or deployment exposure is established.

**Done when:** missing/unreadable configuration causes explicit failure; no source fallback decrypts the new file; provider changes stay isolated; staging authentication uses the intended protected connection.

### Step 4 — restore build, security, and test gates

**Purpose:** make later fixes verifiable and prevent known vulnerabilities from reaching release.

Work:
- Align ESLint and React/Next plugins to resolve the existing lint crash.
- Update affected dependencies to supported patched versions, triaging runtime and development findings separately.
- Pin/document Node and PocketBase versions.
- Add automated build, type, lint, migration, permission, and shipping checks. Extend these checks with each later step.
- Ensure backend migrations/hooks are included in versioned release inputs; they currently sit outside the frontend repository.

**Done when:** checks run successfully from a clean checkout; applicable critical/high dependency findings are resolved or explicitly assessed; CI prevents failing changes from becoming a release.

### Step 5 — make payment status trustworthy

**Purpose:** eliminate forged payment completion and unpaid orders marked paid.

Work:
- Separate payment status from fulfillment status, with required schema migrations.
- Create pending checkout attempts; record Stripe session/payment identifiers.
- Require signature verification with freshness checks and validate payment status, order/session binding, amount, currency, and mode.
- Remove production test-order fallback; payment configuration failure must not create a successful purchase.
- Handle cancelled, expired, failed, and delayed payments explicitly.
- Keep COD only if explicitly wanted for launch; if retained, payment stays unpaid until collection is recorded.

**Done when:** unsigned, invalid, stale, wrong-order, wrong-amount, wrong-currency, and unpaid events cannot mark an order paid. Provider failure leaves an accurate recoverable state. Verified sandbox payment completes the intended order.

### Step 6 — unify pricing and complete order snapshots

**Purpose:** make the displayed quote, charged amount, and saved order agree.

Work:
- Establish one server-owned pricing calculation for products, category promotions, discounts, shipping, and totals.
- Enforce USD for the launch catalog; review existing product currency data rather than silently relabeling prices.
- Store immutable catalog-owned item names, SKUs, quantities, prices, contact/address data, and the monetary breakdown.
- Validate item counts, quantities, destinations, and monetary bounds.
- Decide applicable US sales-tax handling with the owner and appropriate tax input; implement the approved behavior or remove unsupported tax claims. Do not invent a tax rate.
- Retain Step 1's admin shipping policy and stale-quote review behavior.

**Done when:** browser tampering cannot alter authoritative amounts or item identity; category promotions agree across views; saved receipts reconcile exactly with provider amounts; schema round trips preserve all required fields.

### Step 7 — make stock and retries safe

**Purpose:** stop overselling, duplicate orders, and repeated stock deductions.

Work:
- Implement transactional inventory allocation/reservation and order writes.
- Deduplicate checkout attempts and provider events with durable unique identifiers.
- Define reservation expiry and release on cancellation/failure.
- Make retries recover from partial failures without repeating business effects.
- Add atomic cart updates and unique customer/product records for the retained cart flow.

**Done when:** two buyers competing for the last unit cannot both obtain it; duplicate events/requests have one effect; database/provider interruption leaves recoverable state and correct stock.

### Step 8 — repair checkout recovery and order access

**Purpose:** preserve the buyer's cart and provide a reliable post-purchase experience.

Work:
- Keep cart contents while payment is pending; reconcile purchased quantities after verified completion.
- Recover cancelled/expired checkout attempts; preserve items added while payment was in progress.
- Merge guest carts on sign-in using the approved quantity/availability policy.
- Make confirmation reflect actual payment state and handle webhook delays.
- Complete secure guest order retrieval and account-owned order details.
- Show the saved shipping/payment breakdown on receipts and downloadable summaries.

**Done when:** guest and account buyers can purchase, cancel, retry, sign in, and revisit their own order without losing their cart or exposing another buyer's information.

### Step 9 — finish account and administrator controls

**Purpose:** make visible account controls actually work against the database.

Work:
- Add supported account fields and make deactivation persist and invalidate continued access.
- Implement verified email changes and correct password/session refresh behavior.
- Replace the hardcoded privileged email with explicit administrator capabilities.
- Make admin creation/password recovery conform to PocketBase auth-management permissions.
- Preserve US saved-address fields through API and database round trips.
- Validate email verification/reset-link destinations and behavior; delivery transport is completed in Step 11.

**Done when:** deactivated sessions lose access, users can safely update supported fields, admin operations respect real privileges, and saved addresses retain their state/ZIP information.

### Step 10 — make fulfillment and refunds real operations

**Purpose:** connect dashboard actions to business outcomes.

Work:
- Define permitted fulfillment transitions and their authorization requirements.
- Record shipment/tracking details or an explicit manual fulfillment workflow.
- Implement provider refunds or verified manual refund records; never use a label change as proof money moved.
- Apply the approved cancellation/refund stock policy.
- Preserve an audit history and archive orders instead of permanently deleting commerce records.

**Done when:** staff can fulfill, cancel, and refund an order with correct payment/stock effects and traceable history; reports exclude unpaid/test orders from revenue.

### Step 11 — connect support and customer notifications

**Purpose:** stop losing messages and leave buyers with usable receipts/recovery links.

Work:
- Connect the homepage contact form to validated, rate-limited, durable message delivery.
- Configure and verify verification/password-reset email delivery.
- Send order receipts, secure guest links, and approved shipment/refund notifications.
- Add durable notification jobs with retries, deduplication, and visible delivery failures.
- Preserve admin push notifications without depending on unawaited request-lifetime promises.

**Done when:** real staging messages reach the intended test inbox, failures can be retried, and duplicate events do not send repeated receipts. External test recipients must be explicitly approved before messages are sent.

### Step 12 — approve product facts, offers, and policies

**Purpose:** ensure the website sells the actual product under accurate promises.

Work:
- Obtain approved ingredients, allergens, nutrition, storage, shelf life, and delivery information.
- Resolve whey versus vegan/dairy-free claims and added-sugar contradictions from verified product facts.
- Implement the advertised first-order 10% discount with clear eligibility, or remove the offer based on owner decision.
- Align shipping copy with the approved US-only flat-rate policy; preserve the Step 1 removal of worldwide/free-over-$99 claims.
- Create accurate store identity, privacy, terms, shipping, and returns pages for the actual operating business and launch market.
- Review consent/retention needs for the actual integrations and jurisdiction with appropriate input.

**Done when:** owner-approved product facts and policies agree across pages; every advertised offer is honored; policy links lead to the correct documents. This requires business facts that cannot be derived from code.

### Step 13 — clean retained pages and validate usability

**Purpose:** make the intended website navigable and accessible without restoring retired pages.

Work:
- Remove shop/wishlist and other retired destinations from active links and sitemap; fix self-redirects and choose deliberate legacy URL behavior.
- Set production canonical URLs, language, metadata, social images, and indexing rules.
- Distinguish service outages from empty carts/catalogs; add recovery/error views instead of misleading fallback prices.
- Review retained homepage, product, checkout, account, and dashboard flows on mobile/desktop, keyboard, and screen readers.
- Remove dead components only after tracing current usage; update project documentation to Chia Charged's real architecture.

**Done when:** retained internal links resolve, generated URLs use the production domain, no redirect loops remain, and core flows pass browser/accessibility checks with clear failure states.

### Step 14 — harden performance, abuse protection, and observability

**Purpose:** keep the store manageable as traffic and order history grow.

Work:
- Protect active checkout/auth/contact/visit routes and direct backend access with appropriate rate/body limits and trusted client-IP handling.
- Make Redis configuration/degradation secure and observable.
- Add server pagination/search, batch record lookups, and indexes justified by measured queries.
- Correct visitor-retention job and define limited, accurate analytics metrics.
- Implement only desired tracking integrations; remove misleading configuration controls for integrations that remain unused.
- Monitor errors, payment/webhook failures, background jobs, service health, and backup status with actionable alerts.

**Done when:** tests with representative data meet agreed latency/error targets; abuse controls behave predictably; an operator can detect and investigate failed orders/jobs. Test traffic remains in staging.

### Step 15 — prove deployment, restoration, and launch readiness

**Purpose:** make the combined release repeatable and recoverable.

Work:
- Confirm actual host, domains, backend data directory, secret storage, persistent image storage, and deployment ownership.
- Build a clean staging deployment from versioned inputs and documented configuration.
- Back up database/files/configuration and demonstrate a restore to an isolated instance.
- Prepare migration order, maintenance strategy, reconciliation procedure, rollback limitations, and operator runbook.
- Run complete guest/account/admin journeys, payment sandbox scenarios, retry/concurrency tests, email/support checks, and browser checks.
- Present final go/no-go evidence and exact deployment target for explicit launch approval.

**Done when:** a clean install and restore work, all critical/high launch defects are closed, monitoring/support ownership is clear, and the owner approves the release. Public deployment happens only after that approval.

## Business decisions to request when their step is ready

| Decision | Needed by |
|---|---|
| Keep card payment only, or also retain COD? | Step 5 |
| Canonical USD catalog prices and US tax handling | Step 6 |
| Cancellation/refund/restocking policy and fulfillment/tracking workflow | Step 10 |
| Sender domain, approved test inboxes, support owner | Step 11 |
| Approved food labels, first-order offer, legal entity and policies | Step 12 |
| Required analytics and operating targets | Step 14 |
| Actual staging/production host, domain, backup targets, release window | Step 15; obtain earlier if staging is needed |

Do not ask for all decisions at once. Prepare the relevant step and request only what blocks that work.

## Release-wide acceptance criteria

- Unauthorized users cannot read/change customer data, grant roles, change prices/stock, or fabricate orders.
- Paid means verified payment; refunds and fulfillment statuses reflect real operations.
- Server quote, payment amount, saved order, receipt, and stock reconcile under retries and failures.
- US-only shipping uses the saved admin rate; historical orders retain their charge.
- Retained buying/account/support flows work on supported devices, with accurate product claims and policies.
- Build/type/lint/security/integration/browser checks pass; migration, deployment, monitoring, and restore are demonstrated.

Optional features such as reviews, loyalty, advanced coupon campaigns, or extra animation are outside this launch plan unless explicitly added. Retired wishlist infrastructure needs access restrictions where still present, not renewed feature development.

## Collaboration update - 16 September 2026

Keep responses short. Agent handles code/security checks; owner can perform simple browser tests once isolated preview is configured. See [Step 3 review and manual checklist](step-3-credentials.md). Production host/domain remains undecided.
