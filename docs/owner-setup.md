# Owner setup

## Dashboard

- **Settings:** business name, public business address, support email, US shipping rate, first-order offer switch/percentage, shipping and delivery policy, returns policy, privacy policy, terms, storage/shelf life and preparation instructions.
- Storage/preparation instructions apply to every current flavor. State flavor-specific differences explicitly and follow verified packaging. Blank fields display an unpublished-information message, not an invented promise.
- **Products:** prices, USD currency, inventory, ingredients, allergen statements and nutrition for each product/variant. New products start with blank label data. Existing imported labels remain editable. Never copy another flavor’s label without confirming it applies.
- **Keys:** payment credentials and optional Google login configuration. Do not put credentials in public Settings fields.
- **Orders:** fulfillment/tracking and refunds. Check recorded payment status before fulfillment.

The Settings checklist reports entered fields, including unsaved edits. It does not certify content accuracy or launch readiness. Save changes, refresh the storefront, and check the FAQ and policy pages.

## Deployment administrator

Configure hosting, canonical HTTPS domain, protected backend, persistent database/file/credential storage, encryption key, Stripe webhook secret, email transport, backups and monitoring. Stripe account tax settings/registrations are maintained in Stripe. Public dashboard text fields do not configure these services.

Notification delivery worker and real provider testing remain unfinished. Do not enable the verified-account first-order offer before verification emails work. Run staging purchase/refund, email, permissions and restore checks before public launch.

## Product claims changed

Current supplied ingredients contain whey/milk and chocolate cane sugar. Removed positive vegan/dairy-free and zero-added-sugar claims. Replaced unsupported metabolic/blood-sugar claims. Removed unverified testimonials from homepage/product rendering and customer-count/rating claims from homepage stats. Shipping/returns/storage/preparation FAQ now reads saved settings. Missing product nutrition no longer inherits a generic label.

Imported historical labels are business-supplied reference data, not newly verified measurements. Owner must confirm current packaging and any numeric claims before launch. Existing image artwork and blog content still need content review.


## Testimonial restoration

Owner requested original testimonials and ratings restored. Homepage and product page use dashboard-managed testimonials with original copy/photos/stars and rating totals seeded by migration. Admin Settings supports editing, adding, removing, ordering, visibility, verified badges and aggregate figures. Totals are manual editorial values, not computed order statistics. Existing quotation wording is preserved by request; product claims outside testimonials remain corrected. Seven pricing/nutrition test entries and production build passed. No production activation performed.
