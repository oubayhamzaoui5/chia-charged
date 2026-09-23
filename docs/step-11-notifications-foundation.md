# Step 11 — support and notification foundation

Local foundation implemented on 21 September 2026.

## Implemented

- Homepage contact form now validates, rate-limits, and durably stores messages.
- Added body-size limits and a bot honeypot.
- Added administrator-only `support_messages` records.
- Added deduplicated `notification_jobs` with status, attempts, retry time, error, and sent time fields.
- Until sender configuration exists, support notification jobs are explicitly marked `blocked_configuration`; messages remain stored and visible instead of disappearing.
- Local preview submission succeeded and returned a reference number.

## Still blocked on production inputs

- Sender domain and mailbox/provider credentials.
- Approved support recipient and approved staging test inbox.
- Final HTTPS app/backend URLs for verification, email-change, password-reset, receipt, and guest-order links.
- Real staging delivery verification. No external message was sent during local work.

Worker, bounded retries, support and order templates, transactional enqueueing, and admin status page are now implemented. See [email delivery runbook](email-delivery.md). Itemized receipts and secure guest email links are also implemented locally. Real SMTP/inbox and native account-email acceptance remain outstanding.
