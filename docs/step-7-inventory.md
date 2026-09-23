# Step 7 — stock and retry safety

Status: implemented and verified locally. Existing business databases remain unchanged. No deployment performed.

## Behavior ready for review

- Checkout reserves stock and creates its pending order in one PocketBase transaction. Competing buyers cannot reserve the same final unit.
- Browser checkout attempts carry a stable idempotency key. A durable unique hash prevents duplicate orders; a request fingerprint rejects reuse with changed data.
- Stripe receives the same idempotency key on retry. A saved session URL lets interrupted responses resume without another order or stock deduction.
- Definite provider rejection releases stock immediately. Ambiguous network/session-save failures retain the reservation so retry can recover safely.
- Stripe completion consumes the reservation once. Signed failure/expiry events release it once. A five-minute backend job releases abandoned reservations after the Stripe session deadline.
- Checkout/session/event/reservation fields are immutable through normal administrator record updates.
- Cart add is transactional. A unique `(user, product)` index guarantees one row and concurrent adds combine quantities.
- Existing duplicate cart rows are merged during migration, capped at the current quantity limit of 99.

## Verification

`npm run test:inventory` uses a disposable database and proves:

- two simultaneous buyers competing for one unit produce one reservation;
- repeated checkout keys create one order and deduct stock once;
- a changed request cannot reuse an existing key;
- repeated release and payment events have one effect;
- expiry restores stock exactly once;
- concurrent cart additions create one row with the combined quantity.

Payment, pricing, shipping, security, credentials, build, TypeScript, and lint-regression checks remain part of the full gate.

Current result: 47 test entries pass; production build and TypeScript pass; lint regression reports 270 existing diagnostics and zero new diagnostics.

## Activation requirements

1. Identify and back up the actual PocketBase data directory and uploaded files.
2. Review current pending Stripe sessions and stock before migration. Reconcile or expire them before enabling reservations.
3. Deploy migration `1789776000_inventory_reservations.js`, both inventory hook files, and the Next.js release together.
4. Keep PocketBase running continuously so the expiry job executes. Monitor `[inventory-expiry]` and checkout/webhook failures.
5. Run a Stripe sandbox purchase, cancellation/expiry, provider retry, replay, and last-unit concurrency check against staging.
6. Do not roll this migration down after reservations exist. Use a forward correction or restore and reconcile from backup.

## Remaining limit

Checkout still clears the browser cart when Stripe redirects, before verified payment. Step 8 will preserve and reconcile carts across payment, cancellation, and webhook delay.
