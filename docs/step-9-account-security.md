# Step 9 — account and administrator controls

Implemented locally on 21 September 2026.

## Changed

- Added persisted `isActive` and `canManageAdmins` account fields.
- Deactivation requires the current password, persists in PocketBase, clears the browser cookie, and rotates the account token key so existing tokens cannot keep private access.
- Active-account checks now protect customer and administrator database rules.
- Email changes use PocketBase's verified email-change workflow. The current address remains active until confirmation.
- Password changes issue a fresh session after PocketBase invalidates the old token.
- OAuth rejects inactive accounts.
- Replaced the hardcoded privileged email with `canManageAdmins`.
- Admin creation uses the backend service boundary and an emailed password-setup link. Password recovery sends a reset link; staff no longer choose or view another admin's password.
- Saved addresses now persist address line 2, US state, country, and ZIP. Account forms and APIs accept US addresses only.
- Saved-address deletion now works through an ownership-checked endpoint.

## Verification

- `npm test`: 50 checks passed.
- `npm run build:check`: production build and TypeScript passed.
- `npm run lint`: 0 new diagnostics; 259 historical diagnostics remain in the baseline.

## Activation dependencies

- Real email delivery and approved sender/test inbox remain Step 11 work.
- Email action links require the final canonical HTTPS app/backend URL. Domain and host remain undecided.
- This migration has only run against disposable local databases. Back up and rehearse before applying it to business data.
