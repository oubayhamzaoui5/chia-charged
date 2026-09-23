# Step 8 — checkout recovery and order access

Status: implemented and verified locally. Existing business databases remain unchanged. No deployment performed.

## Behavior ready for review

- Checkout no longer deletes cart contents when redirecting to Stripe. Pending, failed, and expired payments leave the cart intact.
- A verified paid webhook subtracts only purchased quantities from an account cart in the same transaction as payment finalization. Items added during payment remain.
- Guest carts reconcile once after verified payment. A per-order browser marker prevents repeated subtraction.
- Signing in merges the guest cart into the account cart in one database transaction, combining duplicate products up to the existing quantity limit.
- A pending guest checkout delays guest-to-account merge until payment resolves, preventing purchased items from reappearing after sign-in.
- Returning from Stripe cancellation calls a protected order endpoint. It expires the Stripe session first, then releases inventory. The cart remains available for retry.
- Checkout attempt state survives redirects and ambiguous network failures, allowing the same Stripe session and order to resume safely.
- Confirmation polls briefly while the signed webhook is pending, then shows verified paid, failed, or expired state. Receipt download is enabled only after verified payment.
- Guest confirmation still requires the scoped HttpOnly order cookie. Account orders remain restricted to their owner; administrators retain operational access.
- Confirmation and receipt use the saved item, shipping, discount, tax, total, address, payment, and fulfillment snapshots.

## Verification

- Cancellation integration test proves Stripe expiry occurs before stock restoration.
- Inventory tests prove paid cart subtraction preserves later additions, repeated payment has one effect, and guest-cart merge produces one combined row.
- Full suite: 48 test entries pass.
- Production build and TypeScript pass.
- Lint regression: 270 existing diagnostics, zero new diagnostics.

## Activation requirements

Deploy Step 7 migration/hooks and Step 8 application changes together. Run guest and account Stripe sandbox journeys for success, delayed webhook, browser back/cancel, expiry, refresh/retry, sign-in during checkout, and additions made while payment is open.

## Remaining limit

Guest access currently depends on the scoped cookie stored in the purchasing browser. Durable emailed guest links belong to Step 11, after sender domain and approved inboxes are known.
