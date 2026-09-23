# Production readiness: approval log



Owner requested approval at every step. Prepare and test each bounded change locally, then pause for approval before activating it or starting the next step.



## Step 1 — admin-controlled US shipping



Status: implemented locally; owner subsequently authorized starting Step 2. Activation approval remains pending. No migration applied to the existing local or remote business database. No deployment performed.



Owner decision: United States delivery only. Shop/wishlist are retired pages; do not restore them as launch requirements.



### Behavior ready for review



- Dashboard → Settings → US Shipping: one editable flat shipping rate in USD per order. Zero means free shipping.

- Migration initializes the existing US rate at $5.00. Admin can change it after activation.

- Checkout displays the saved rate; both order-creation endpoints calculate shipping from backend settings and ignore browser-supplied shipping/total.

- Checkout requires US country, state, and five-digit ZIP. The country choice is fixed to United States.

- If rate changes during checkout, buyer sees the new total and must submit again. No order is created for a stale rate.

- Shipping amount/version and country/state are stored on new orders. Confirmation/PDF use the saved shipping amount; old orders retain the existing inferred fallback.

- Missing/invalid shipping configuration blocks checkout with a retry option.

- New shipping settings collection permits public reads and locks direct create/update/delete to PocketBase superusers. Dashboard action first checks the existing admin session.

- Shipping FAQ now describes US-only flat-rate delivery; removed international/free-over-$99 claims inconsistent with this policy.



### Verification



`npm run test:shipping` creates a disposable PocketBase database, applies migrations, tests real API permissions and current route code, mocks external payment transport, and removes only its own temporary data. Eight integration scenarios cover defaults/public reads, denied direct writes, admin authorization/input validation, non-US destinations, shipping tampering, changed rates/order snapshots, free shipping, and missing configuration. TypeScript/build checks run separately.



Full-repository lint remains blocked by the pre-existing ESLint 10 / React plugin incompatibility documented in the audit; that toolchain repair is a later step.



### Activation after approval



1. Identify the actual PocketBase data directory and deployment host; inspect existing shipping/order fields to avoid migration conflicts. Do not assume the adjacent local database is production.

2. Back up target database and files, and retain the previous application release.

3. Apply `pb/pb_migrations/1789344000_shipping_settings.js` using the target's migration runner. This migration lives alongside the backend, outside the frontend Git repository, so include it explicitly in deployment.

4. Ensure server-side `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` reference a working backend superuser. Public reads do not use those credentials; dashboard writes do.

5. Deploy frontend/server changes together, then verify admin save, US checkout quote, rejection of non-US requests, changed-rate review, and shipping on confirmation.

6. Avoid rolling down the migration after real orders use these fields: rollback deletes shipping snapshots. Prefer a forward correction or restore the agreed backup while reconciling intervening orders. An old application release would restore the shipping vulnerability, so do not expose checkout during rollback.



### Remaining safety limits



This step fixes shipping calculation/configuration only. Existing open `users`, `products`, and `orders` rules still allow bypassing app checks, including promoting a user to admin. Existing premature-paid states, unsigned webhook acceptance, replay/stock bugs, test-mode fallback, remote HTTP transport, and credential weaknesses remain. Do not call the entire checkout production-safe or deploy publicly based on this step alone.



## Step 2 - database access control and trusted order boundary



Status: local implementation complete; awaiting owner review. Owner authorized this scope with -start working on the next step-. Existing local and remote business databases remain unmigrated. No deployment performed.



See [Step 2 review and permission matrix](step-2-access-control.md) for exact behavior, files, acceptance results, activation checks and limits.



- Added explicit collection rules, customer ownership isolation, protected role/verification fields and public catalog filtering.

- Moved checkout writes to a server-only service client, retained public-rule product lookup, and secured guest receipts with scoped expiring cookies.

- Protected files, fixed admin report authentication, and scoped push subscription management to its administrator.

- Thirteen security scenarios and eight shipping regression scenarios pass. Production build and TypeScript pass. Existing lint incompatibility remains Step 4.

- Database migration/hook/application changes must activate together after target review, backup and explicit approval. Security migration refuses automatic rollback to open rules.



## Step 3 - credentials, transport and configuration

Local implementation prepared; awaiting owner review. Owner authorized continuation. Domain and hosting remain undecided. Existing secrets and business databases untouched.

See [Step 3 review, configuration and manual checklist](step-3-credentials.md). Credential migration tool tested on synthetic files; actual credential migration and HTTPS deployment remain pending activation approval. Twenty-nine integration scenarios passed across all three steps; TypeScript passed. Production build passed using synthetic configuration; result in step-3-build.log.

## Step 4 - repair validation gates

Owner authorized implementation. Local dependency, build and integration checks prepared; see [Step 4 review](step-4-validation.md). Zero audit findings; 29 scenarios and production build pass. Lint regression gate passes against 289 existing diagnostics; full lint is not clean. Unsupported ESLint compatibility pin, clean-checkout/Linux CI verification and required branch checks remain outstanding. Await owner review of this limitation before Step 5.

## Step 5 - trustworthy payments

Owner authorized continuation and explicitly selected card-only checkout. Local implementation prepared; see [Step 5 review](step-5-payments.md). Cash on delivery is disabled. Signed Stripe events alone can mark exact matching orders paid; payment and fulfillment are separate; verified-payment reporting replaces legacy status-based revenue. Thirty-eight current test entries pass across shipping, access, credentials and payments. Production build and TypeScript pass. Real Stripe sandbox verification and database activation remain pending.

## Step 6 - authoritative pricing and snapshots

Owner authorized continuation and requested normal US tax handling. Local implementation complete; see [Step 6 review](step-6-pricing.md). Checkout now owns USD pricing, category/direct promotions, quantity and monetary limits, immutable snapshots, Stripe Tax calculation for food and shipping, and exact cent-level provider reconciliation. Forty-two test entries, lint regression gate, TypeScript, and production build pass. Stripe head-office settings and legally held state registrations remain activation requirements. Existing data migration and public activation remain pending.

## Step 7 - stock and retry safety

Owner authorized Step 7. Local implementation complete; see [Step 7 review](step-7-inventory.md). Stock reservation and order creation are atomic; checkout/provider retries are idempotent; failure and expiry release stock once; paid reservations consume once; cart additions are transactional with one customer/product row. Forty-seven test entries, production build, TypeScript, and lint regression pass. Existing business data remains unmigrated and no deployment occurred.

## Step 8 - checkout recovery and order access

Owner authorized continuation. Local implementation complete; see [Step 8 review](step-8-checkout-recovery.md). Carts remain intact until verified payment; paid orders subtract only purchased quantities; cancellation expires Stripe before releasing stock; guest carts merge atomically after sign-in; confirmation polls for signed webhook state and only offers a receipt after payment. Forty-eight test entries, production build, TypeScript, and lint regression pass. Existing business data remains unmigrated and no deployment occurred.

## Collaboration preference

Minimize tokens. Keep updates short. Delegate simple browser acceptance to owner after a safe preview is available. Do not repeat passing checks without a new change or unresolved concern.
## Step 9 — account and administrator controls

Completed locally on 21 September 2026. Account activity and admin-manager capability now persist in PocketBase; deactivation invalidates existing tokens; email/password changes follow PocketBase auth flows; admin passwords use reset links; US saved addresses round-trip all required fields. All 50 automated checks pass, production build/type checks pass, and lint reports no new diagnostics. See [step-9-account-security.md](step-9-account-security.md).
## Step 10 — fulfillment and refunds

Completed locally on 21 September 2026. Fulfillment is forward-only with required tracking; full Stripe refunds are idempotent; unshipped stock restores once; shipped returns require physical handling; immutable events record operations; orders archive instead of delete. All 51 automated checks pass, production build/type checks pass, and lint reports no new diagnostics. See [step-10-order-operations.md](step-10-order-operations.md).
## Step 11 — support and notification foundation

Implemented locally on 21 September 2026. Contact submissions are validated, rate-limited, stored durably, and paired with deduplicated notification jobs. Jobs remain visibly blocked until sender/provider and recipient configuration is supplied. Local preview submission succeeded. See [step-11-notifications-foundation.md](step-11-notifications-foundation.md).

## Store configuration and first-order offer — 22 September 2026

Follow-up: owner setup checklist and storage/preparation fields added to Settings; shipping/returns/storage/preparation FAQ uses saved settings. Corrected whey/milk and sugar claims across retained homepage/About copy and metadata; removed rendered unverified testimonials and homepage ratings/customer counts. Missing/new product label data stays blank. See [owner setup](owner-setup.md). Production activation remains pending; image/blog content review and provider delivery remain open.

Admin Settings now manages first-order discount activation and percentage (1–99), business identity/contact details, shipping/returns/privacy policies, and terms. Policies render as plain text on public pages linked from footer and checkout. Empty business fields remain incomplete; no business facts or legal terms were invented. Shipping price remains in existing admin shipping settings. Removed unsupported $99 free-shipping claims.

Offer defaults off. Server applies it only to regular-price items for an active, verified signed-in account with matching checkout email and no paid/refunded order. Existing product/category promotions take precedence. Atomic reservation prevents concurrent discounted checkouts for the same account/email. Open Stripe sessions retain their quote after configuration changes. Eligibility is account/email-based, not a guarantee against one person creating multiple identities. Email verification delivery must work before enabling this offer.

Validation: 10 pricing/inventory test entries pass, including permission enforcement, percent bounds, activation, guest exclusion, simultaneous claims, repeat orders, and Stripe cents. Production build/type checks pass; lint regression gate passes with 252 pre-existing diagnostics. Refreshed isolated preview; settings API and public policy page return 200. No production database migration or deployment performed.

Manual acceptance: Admin > Settings; save a percentage and toggle offer, refresh storefront, confirm promotional text appears/disappears; save policy text and check its public page. Populate real business details and policies before launch. Domain/hosting, payment/tax account setup, mail delivery, production secrets and live provider checks still require external configuration.


## Testimonial restoration

Owner requested original testimonials and ratings restored. Homepage and product page use dashboard-managed testimonials with original copy/photos/stars and rating totals seeded by migration. Admin Settings supports editing, adding, removing, ordering, visibility, verified badges and aggregate figures. Totals are manual editorial values, not computed order statistics. Existing quotation wording is preserved by request; product claims outside testimonials remain corrected. Seven pricing/nutrition test entries and production build passed. No production activation performed.


## Notification worker

Added PocketBase SMTP worker, transactional support/receipt/shipment/refund outbox, bounded retries, uncertain-delivery handling and admin status page. Local payment/inventory/order operations tests (11 entries) and notification tests (2) passed. No external email sent. See [email delivery](email-delivery.md) for deployment and remaining guest-link/itemized-email work.


## Itemized receipt and guest email recovery

Implemented saved-order monetary breakdown, seven-day hashed guest email access, standalone fragment-token landing page, rate-limited cookie exchange and recovery cart protection. Notification/security tests and production build passed; real email delivery remains disabled pending hoster configuration and staging inbox verification.


## Retired routes and discovery cleanup

Removed unused 623-line shop listing client after confirming no imports. Retained shared product components and protected wishlist APIs still used elsewhere. Footer, menus, order empty states and 404 now point to retained destinations. Old catalog/category/offer URLs redirect to homepage flavors; wishlist to home; old product URLs preserve product identity. Sitemap now contains retained public pages and published catalog/blog records, uses validated canonical origin, and isolates catalog/blog failures. Robots excludes private/account/checkout/API routes (not an access-control mechanism). Build passed; lint debt reduced from 252 to 239 with no new findings. Preview redirect/sitemap checks passed apart from an encoded French URL subsequently corrected and rechecked.


## Runtime safety cleanup

Atomic Redis counter/expiry; production outage denial with bounded logging; bounded development fallback; authenticated/TLS Redis URL support. Repaired visit retention job runtime handle and bounded deletions. Stabilized admin status components, sidebar hydration and auth initialization. Three runtime safety tests pass. See [runtime hoster notes](runtime-safety.md). Real Redis/ingress verification remains staging work.


## Local-first preparation — 23 September 2026

Owner confirmed sequence: finish locally, verify on owner VPS, then hand over to business hoster. Replaced anonymous proxy tracking and disconnected beacon with one admin-controlled first-party path. Default off; browser opt-outs respected; server-generated cookie identity, hashed stored ID, no private/query paths, one record per browser/UTC day with transactional deduplication. Removed always-on Vercel analytics component. Added README, .env.example and hoster runbook. Full-suite testing exposed a daily-sales timezone bug at local midnight; daily sales and visit counters now use UTC. VPS activation remains pending.

Validation: full automated suite and production build/type checks passed. Lint regression gate passed with 234 existing diagnostics. Follow-up malformed visitor payload fix passed the visitor integration suite. Restarted isolated local preview: homepage, public settings and guest recovery page return 200; analytics defaults off, homepage sets no visitor cookie, recovery retains no-referrer and nonce-based CSP headers. No VPS deployment or external email/payment performed.

Remaining local gates: fresh-install rehearsal, backup/restore rehearsal, prioritize remaining lint findings that affect behavior, and manual desktop/mobile acceptance. Then owner VPS validation must cover real Redis failure behavior, HTTPS/proxy configuration, Stripe test-mode checkout/webhooks/tax, SMTP inbox delivery and restore operations before hoster handover. Owner business content and verified product/testimonial claims remain launch prerequisites. See [hoster handover](hoster-handover.md).
