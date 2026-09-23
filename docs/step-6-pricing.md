# Step 6 review: pricing and order snapshots

Status: implemented and verified locally. No business database migrated. No public deployment performed.

## Ready for review

- Checkout owns all prices. Browser names, SKUs, prices, currency, subtotal, tax, shipping, and total are ignored.
- One shared catalog resolver applies direct product promotions and active category promotions. Storefront, guest cart, account cart, admin product views, and checkout use the same promotion rules.
- New catalog data is USD-only. Migration stops if any existing product is not already marked USD, requiring manual price review instead of relabeling values.
- Quantity limits: 50 distinct products, 99 units per product, 200 total units. Duplicate products, invalid quantities, unavailable stock, unpublished products, invalid prices, and excessive totals fail before order creation.
- New orders save integer-cent subtotal, discount, item total, shipping, tax, and total. Stripe receives the exact saved total.
- Each order saves immutable catalog item names, SKUs, base/unit prices, discount source, quantities, and a contact/address snapshot.
- Receipts and admin order details use the saved breakdown. Currency fallbacks and remaining visible Tunisian-dinar labels were changed to USD presentation.
- Stripe Tax calculates destination-based US sales tax using the buyer's Stripe-verified shipping address. Food products and shipping use separate Stripe tax codes; prices are tax-exclusive. Stripe collects only in jurisdictions configured as registered in the merchant account, so no universal rate is guessed.
- Pending orders show tax as awaiting Stripe. A signed completion event must contain a completed automatic-tax calculation, the exact item subtotal and shipping, zero unapproved discounts, valid US address, and internally consistent tax/total before payment is accepted. The verified tax, total, and fulfillment address then replace the pending estimate.

## Verification

- Full integration suite: 42 test entries pass across shipping, access control, credentials, payments, and pricing.
- Pricing integration uses a disposable migrated PocketBase database and proves category promotion consistency in guest/account cart views, exact integer-cent snapshots, exact Stripe amount, browser tamper resistance, quantity/stock bounds, and USD schema rejection.
- Lint regression gate: 270 existing diagnostics, 0 new diagnostics.
- Next.js production build and TypeScript pass. Build intentionally falls back to static sitemap routes because its isolated verification environment has no live PocketBase endpoint.

## Activation requirements

1. Export all current products with price and currency. Review every non-USD row and decide its real USD price before migration.
2. Configure the Stripe Tax head-office address. Add only state registrations the business legally holds; creating a Stripe registration does not register the business with a tax authority.
3. Back up the target PocketBase database and files.
4. Apply `backend/pb_migrations/1789603200_order_pricing_snapshots.js` with the earlier migrations and matching application release.
5. Verify taxable and non-collecting test addresses, food classification, shipping tax treatment, one category promotion, webhook completion, receipt, and admin order detail in Stripe sandbox.

## Remaining limits

- Step 7 must add atomic inventory reservation, checkout request deduplication, and reservation release. Current stock checks prevent obvious invalid quantities but do not prevent two simultaneous buyers taking the last unit.
- The advertised first-order offer is not part of authoritative pricing. It must be removed or implemented with explicit eligibility in the later content/offer step.
- Stripe Tax account setup and state registrations, real sandbox verification, production URLs, credential activation, data backup, migration, and deployment remain pending.
