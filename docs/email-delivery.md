# Transactional email delivery

## Deployment

Deploy all migrations and hooks together. PocketBase `serve` runs the notification worker once per minute; no separate Node worker is needed. Configure SMTP and sender identity in PocketBase settings using the hoster's provider. Set `CHIA_MAIL_ENABLED=true` on the **PocketBase process** only after staging setup and approved-recipient verification. Leave absent/false until then. This switch controls the custom notification worker, not PocketBase's native verification/reset mail.

Set the support recipient in website Admin > Settings > Support email. This address is public and receives support notifications. Credentials belong in protected backend/deployment configuration, never in public store settings. Configure final HTTPS auth-email URLs in PocketBase and test verification, password reset and email change separately.

Messages: payment-received summaries, shipment tracking, successful-refund confirmations, support submissions. Order jobs save in the same transaction as the state change. Support submission and its job also save atomically. Unique event keys prevent duplicate enqueueing. Historical orders are not bulk-mailed automatically.

Worker processes at most 20 due jobs per minute. SMTP failure retries with exponential backoff, capped at five attempts. Missing configuration waits five minutes without consuming attempts. Admin > Settings > View email delivery status shows paginated jobs. `sent` means accepted by SMTP, not inbox delivery; monitor provider bounces separately.

## Failure handling

SMTP does not guarantee exactly-once delivery. An ambiguous send exception can cause a duplicate on retry. A crash leaves a processing claim; after 15 minutes it becomes `uncertain`, without automatic resend. If SMTP accepts but saving completion fails, the worker also marks uncertain.

For failed/uncertain jobs, hoster must check provider logs against recipient, subject, time and order reference before retrying. After confirming a retry is appropriate, a PocketBase superuser may set status `queued`, attempts `0`, and clear `nextAttemptAt` and `lastError`. Never reset a confirmed sent job casually. Do not delete commerce records to resolve a delivery error.

## Validation and remaining work

Automated tests use disposable databases, simulated mail-client cases and real PocketBase SMTP transport to a local-only mail catcher; no external messages are sent. Configure template links using the root README. Before launch, run approved-inbox SMTP acceptance, temporary SMTP failure/recovery, verification/reset and purchase/shipment/refund checks. Confirm sent jobs and actual inbox contents.

Receipts now include per-item prices/totals, subtotal, discount, shipping, tax and amount paid from the saved order. Set CHIA_PUBLIC_APP_URL on PocketBase to the HTTPS storefront origin (no path, query or credentials). Receipt jobs remain blocked without this value. Guest receipts include a private seven-day order link; signed-in customers use account access. Public deployment and email activation remain pending.

PocketBase references: [SMTP mail API](https://pocketbase.io/docs/js-sending-emails/), [scheduled jobs](https://pocketbase.io/docs/js-jobs-scheduling/).


## Guest links

Links carry a random token in the URL fragment, not the query. The standalone landing page loads no analytics/external assets, removes the fragment from browser history, then exchanges it for an HTTP-only order-scoped cookie when the customer clicks View my order. The server validates its stored hash, expiry and guest ownership. Recovery does not reconcile the current browser cart. Do not enable request-body logging on the order-access endpoint.

The protected outbox payload retains the token for delivery retries; protect database backups and restrict operator access. Revocation: clear emailAccessHash/emailAccessExpires on the order. Expiry starts when the first delivery attempt prepares the link; retrying does not extend it. Old already-queued receipt payloads are not automatically rewritten. Verify the entire flow using an approved staging inbox before launch.
