# Step 5 review — trustworthy payments

Local implementation prepared on 17 September 2026. No real Stripe request, business database migration, or deployment was performed.

## Result

- Card payment is the only checkout method. The old cash-on-delivery creation endpoint returns `410 Gone` and cannot create orders.
- Checkout creates an unpaid `pending` order. A provider error records `checkout_failed`; it never creates a successful purchase.
- Payment and fulfillment are separate fields. Admin fulfillment actions cannot change provider-owned payment fields. Historical orders migrate to `legacy_unverified`, never assumed paid.
- Stripe sessions are bound to the order, amount, currency, mode and server-calculated total. Session and event identifiers have partial unique indexes.
- Webhooks require the configured secret, a valid constant-time HMAC comparison, and a timestamp within five minutes. Unsigned, stale, wrong-mode, wrong-order, wrong-amount, wrong-currency and unpaid events cannot mark an order paid.
- Successful, expired and failed session events update explicit payment states. Replayed successful events are idempotent.
- Revenue and best-seller reports include only verified `paymentStatus = "paid"` orders. Fulfillment controls no longer offer `paid` or `refunded` as shipping states.
- Customer confirmation and invoices show actual payment state. They no longer claim success or auto-download an invoice while payment is pending.

## Verification

- Shipping suite: 9/9 passed.
- Access/security suite: 15/15 passed, including denial of admin payment forgery.
- Credential suite: 9/9 passed.
- Payment suite: 5/5 passed.
- Production build and TypeScript passed with synthetic configuration.
- Step 5 core payment files have no lint diagnostics. Broader Step 4 lint debt remains tracked separately.

## Activation limits

The migration is forward-only. Before applying it to real data, back up the target and reconcile every `legacy_unverified` order with Stripe records. Application code, migration and webhook configuration must activate together.

A real Stripe sandbox checkout/webhook has not run because no deployment domain or test credentials are configured. That remains an activation gate. Webhook delivery retries/background notification durability belong to Step 11; atomic inventory reservation and stock effects belong to Step 7; cart recovery while payment is pending belongs to Step 8.

Next proposed scope after owner approval: Step 6, one server-owned price calculation and complete immutable order snapshots.
