# Backend release inputs

PocketBase **0.31.0** is the tested baseline. Node **22.23.2** is pinned in `.nvmrc`.

`pb_migrations/` and `pb_hooks/` are release source. Database files and downloaded executables are deliberately excluded. Visit retention now deletes bounded batches using the runtime backend handle. See docs/runtime-safety.md.

From the repository root, run `npm ci`, then `npm run setup:backend`. The installer downloads the official Linux/Windows x64 PocketBase archive and verifies its pinned SHA-256 digest before extraction. Other test platforms can supply `PB_TEST_BINARY`.

`npm test` creates disposable databases, applies these migrations, installs these hooks, and runs shipping, permission and credential scenarios. `npm run preview:local` creates a separate synthetic demo database. Neither command migrates the existing business database.

`npm run build:check` compiles with synthetic configuration. Its build output is for verification, not deployment.

For a real release, deploy the application, migrations and hooks together after target selection, backup and owner activation approval. Do not point test/preview commands at production. The access-control migration intentionally refuses an automatic rollback to open access rules.
