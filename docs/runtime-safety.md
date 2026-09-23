# Runtime safety and hoster requirements

## Redis

Production authentication/contact/guest-link routes using the rate limiter require reachable Redis. Configure `REDIS_URL` (supports provider credentials and `rediss://` TLS) or `REDIS_HOST`, `REDIS_PORT` and optional `REDIS_PASSWORD`. Never expose Redis publicly without protection. Ingress must replace client-IP headers and block direct app access before enabling `TRUST_PROXY_HEADERS=true`; otherwise limits use the shared `unknown` key.

Counter and expiry update in one Redis operation. Missing expiry is repaired. Connection/command timeouts bound request delays. During a production Redis outage protected requests are denied through existing HTTP 429 responses; server logs report dependency failure at most once per minute. Alert on this message and Redis health. Recovery resumes normal limiting automatically.

Development fallback is per process, bounded to 10,000 active keys, and still enforces limits. It is not a substitute for shared production Redis. New unit tests simulate Redis success/failure; hoster must validate actual Redis/TLS connectivity and ingress IP behavior in staging.

## Visit retention

Daily cleanup at 03:00 uses PocketBase's `$app` handle and deletes at most 10,000 visit rows older than 90 days per run. Large historical backlogs need supervised additional cleanup. It no longer requests disruptive database-wide checkpoint/vacuum operations. Visit collection uses the main database.

Existing visitor collection/analytics accuracy still needs review; fixing retention alone does not complete analytics or privacy work.

## UI cleanup

Admin credential status banners are defined outside render, avoiding repeated component remounts. Sidebar skeleton uses stable server/client markup. Initial authentication fetch ignores results after unmount and no longer references a callback before declaration.
