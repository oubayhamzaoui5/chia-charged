# Step 10 — fulfillment and refunds

Implemented locally on 21 September 2026.

## Behavior

- Fulfillment moves forward only: `on hold` → `delivering` → `delivered`.
- Shipping requires carrier and tracking number. Shipment and delivery times persist.
- Refund action issues a full refund through Stripe using an idempotency key tied to the order.
- Pending Stripe refunds remain paid/pending locally and can be reconciled by retrying the same action.
- A successful refund marks payment refunded and fulfillment cancelled.
- Stock is restored once only when the order was never shipped. Shipped/delivered refunds do not assume a physical return.
- Operational fields cannot be changed through direct administrator record writes.
- Every transition, refund state, and archive operation writes an immutable `order_events` audit record.
- Orders are archived from the active dashboard instead of deleted.
- Order detail shows tracking and audit history.

## Verification

- `npm test`: 51 checks passed, including transactional transition/refund/restock/archive coverage.
- `npm run build:check`: production build and TypeScript passed.
- `npm run lint`: 0 new diagnostics; 259 historical diagnostics remain.

## Activation dependencies

- Real Stripe sandbox refund testing requires approved sandbox credentials and a paid test order.
- Shipment/refund customer emails are Step 11.
- Business may later add partial refunds or returned-item inspection. Current launch behavior is full refund only and restocks only unshipped orders.
