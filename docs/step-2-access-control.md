# Step 2 — database access and trusted orders

Prepared locally on 14 September 2026. Awaiting owner review. No existing business database migrated; no deployment performed.

## Result

New migration replaces unrestricted business rules across all 17 business collections. Customer sessions cannot promote themselves, read another customer's records, alter catalog prices/stock, or create/update/delete orders directly. Checkout uses a request-local server service client for writes, while product selection uses an anonymous client subject to publication rules. Item names and SKUs now come from the catalog.

Dashboard reports use authenticated admin clients; client components call protected server actions. Publicly hidden product images in dashboard product/inventory/order views use the checked same-origin file endpoint. No service credential or file token is placed in HTML.

## Permission matrix

PocketBase superusers retain backend administration. “Admin” below means an authenticated `users` record with the saved `admin` role, not a browser-supplied role.

| Collection | Anonymous | Customer | Admin | Backend service |
|---|---|---|---|---|
| users | Register customer without verification privileges | Read/update own profile; cannot change role or verification flags | List/read/create/update/delete, subject to PocketBase auth-management restrictions | Full |
| adresses | None | Own records; ownership cannot be reassigned | All records | Full |
| cart_items | None | Own records; ownership cannot be reassigned | All records | Full |
| wishlists (retired) | None | Own records; ownership cannot be reassigned | All records | Full |
| orders | None | Read own orders | Read/update/delete; direct creation locked | Validated checkout creates orders; scoped receipt handler reads |
| products | Read published catalog; costPrice hidden and unavailable for filtering | Same public reads | Catalog CRUD; cost visible | Order/stock writes |
| categories | Read active categories | Same | CRUD | Full |
| posts | Read published posts | Same | CRUD | Full |
| variables | Read public variant display assets | Same | CRUD | Full |
| vedettes | Read references to active, visible products | Same | CRUD | Full |
| inventory | None | None | CRUD | Full |
| locations | None | None | CRUD | Full |
| transfers | None | None | CRUD | Full |
| transfer_items | None | None | CRUD | Full |
| shipping_settings | Read public rate/version | Same | Dashboard action validates admin before service write; direct writes locked | Full |
| visits | None | None | Read reports | Existing tracking endpoint creates; cleanup remains separate |
| admin_push_subscriptions | None | None | Protected app endpoint manages own subscriptions; direct API locked | Store/send; enforce owner for save/delete |

Published products require active status and store visibility. An active variant is also accessible through an active, visible parent, preserving variant selection without listing each variant independently. Inactive/hidden standalone products are unavailable even to checkout running with server write privileges.

Existing account deactivation fields are still missing from the original schema; full deactivation behavior belongs to Step 9. This step protects existing role and verification fields. Existing admin order deletion/status operations remain until fulfillment/audit-history changes in Step 10.

## Guest receipts

- Each new guest order receives a cryptographically random 256-bit token; database stores only its SHA-256 hash and seven-day expiry.
- Creation response sets an HttpOnly, SameSite=Lax cookie scoped to that order's API path. Secure flag is enabled in production. Tokens are absent from URLs, Stripe metadata, response JSON, and receipts.
- Receipt API requires verified account ownership, admin status, or the matching unexpired guest cookie. Missing, wrong, expired, cross-order and legacy guest access return 404.
- Receipt/creation responses are private and non-cacheable. An order ID alone no longer grants access.
- This provides same-browser access after Stripe's return. Different-device recovery, emailed access links, expired-cookie recovery, and legacy guest access require the Step 8/11 flow. Existing guest orders are deliberately not granted unauthenticated access.

## Files and field privacy

Product cost is hidden in schema; enrichment only restores it to admin/superuser responses. Guest access hashes are hidden and restored only for superuser reads used by the receipt handler.

Product, category, post and variant image fields now use PocketBase protected-file access. These checks apply directly at PocketBase, as well as through the app proxy. Public records can still serve public images. Private image access requires authorized admin access. The proxy resolves a permitted record and matching image field, does not forward browser-supplied tokens, and obtains an admin file token only after verifying the app session. It sends private/no-store and nosniff headers.

New image uploads accept JPEG, PNG, WebP, GIF and AVIF. Existing files are preserved; any historical SVG/HTML or other active-content uploads need inventory/quarantine before activation. Already downloaded or externally cached public assets cannot be recalled. PocketBase's protected-file behavior was checked against its [v0.31 implementation](https://github.com/pocketbase/pocketbase/blob/v0.31.0/apis/file.go).

## Verification

- `npm run test:security`: 13 integration scenarios passed (14 Node test entries including parent suite). Fresh PocketBase database, real migrations/hooks, real anonymous/customer/admin/service API calls, synthetic data only.
- Covers role/verification changes including modifier syntax, profile updates, cross-account read/update/delete/reassignment, catalog publication and private cost filtering, direct order tampering, populated internal collections, categories/posts/variants, guest token expiry and isolation, authenticated checkout, protected admin statistics, subscription ownership, and direct/proxied file access and upload types.
- `npm run test:shipping`: all eight shipping scenarios passed with the new rules/hooks (nine Node test entries including parent suite).
- `npm run build`: passed, including TypeScript and page generation. Standalone TypeScript also passed during implementation.
- Provider calls are mocked. Application session helpers are controlled fixtures in route tests; actual PocketBase credential validation and authorization use real synthetic accounts. This is not a full browser/Stripe sandbox acceptance run.
- Full lint remains blocked by the pre-existing ESLint/React plugin incompatibility; repair remains Step 4.

## Release inputs and activation gate

Backend source currently lives outside the frontend Git repository. Include both the existing shipping migration and these exact new backend files in release review:

- `../pb/pb_migrations/1789430400_access_control.js`
- `../pb/pb_hooks/access_control.pb.js`

Hook and migration must ship together with application changes. Missing enrichment hook causes guest receipt access to fail closed. Do not apply these files to the existing local/remote database until the owner approves the identified target and activation procedure.

Before activation: verify trusted administrators and record ownership in a restored copy of the target, because old public rules allowed role assignment; verify publication flags and retained variants; inventory existing image formats; confirm service credentials and private/HTTPS backend connection; back up database, files and configuration. Database rules do not prove historical data was untampered. No current records were automatically promoted, demoted, re-owned, or deleted.

Migration is forward-only: automatic rollback refuses to reopen public business access. Use a reviewed forward correction or an isolated backup restore, with reconciliation for intervening orders. Maintain checkout closure during any release rollback. Backend files will become versioned release inputs in Step 4.

## Remaining launch blockers

Step 2 closes direct database bypasses, not the whole payment system. Unsigned webhook acceptance, premature paid states, test-payment fallback, replay/stock races, credential storage and HTTP transport still require the planned Steps 3–7. Do not expose this intermediate checkout publicly. Next proposed scope: Step 3, credentials, encryption, transport and configuration; wait for owner approval.
