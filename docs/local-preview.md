# Local preview

Started 17 September 2026. Website: http://127.0.0.1:3100

Demo admin: `admin@preview.example.test`

Demo customer: `customer@preview.example.test`

Both use password: `Preview-Only-123!`

These accounts exist only in the separate preview database. Products, prices and stock are synthetic. No existing database or credential file was changed. Payments and Google sign-in are unconfigured; payment submission is intentionally disabled.

Verified homepage, shipping endpoint, admin login and admin settings return successful responses.

## Your checks

1. Open homepage and a product on desktop/mobile.
2. Sign in as demo admin, open Settings, change US shipping rate and save.
3. Check updated shipping appears at checkout; payment stays unavailable.

Report only problems: page, action and what happened.

Setup requires Node 22.23.2, `npm ci`, and `npm run setup:backend`. Launcher: `npm run preview:local`. It reuses a running preview; otherwise creates a new isolated demo run. Actual ports and process IDs are recorded in ignored `.local-preview/status.json`. Logs/data live under `.local-preview/`. Servers bind only to this computer's loopback address. Initial page compilation may be slow.

This preview is not production deployment or acceptance of later payment fixes. The normal environment remains unconfigured; use the preview launcher for this test setup.
