# 02: EmailAccount admin CRUD and permissions

**What to build:** An admin can create, edit, activate, deactivate, and delete `EmailAccount` records, mark exactly one account as the default, and choose which backoffice users are allowed to use each account.

**Blocked by:** 01 End-to-end inbound receiving

**Status:** resolved

- [x] tRPC procedures exist for listing, creating, updating, and deleting `EmailAccount` records.
- [x] Only one `EmailAccount` can be marked `isDefault` at a time; toggling default updates the previous default.
- [x] tRPC procedures manage `EmailAccountUserPermission` assignments (which users can use which accounts).
- [x] Deleting an account is rejected or handled safely when conversations exist.
- [x] Admin UI lists accounts, supports create/edit forms, activation toggle, default flag, and user assignment.
- [x] tRPC tests verify permission scoping and default-account constraint.

## Comments

Delivered:

- `prisma/migrations/20261017140000_add_email_account_permissions/migration.sql` — seeds `email-accounts.read` / `email-accounts.manage` and grants them to ADMIN.
- `src/modules/mails/accounts/server/procedures.ts` — `emailAccounts` tRPC router: `getMany`, `getOne`, `getAllowed` (per-account scoping for the Conversations selector), `getAssignableUsers`, `create`, `update`, `setDefault`, `setActive`, `setUserPermissions`, `remove`. Default uniqueness is enforced in a transaction; delete is atomic (`deleteMany` guarded by `conversations: { none: {} }`) so a concurrent inbound conversation cannot be cascade-deleted.
- `src/modules/mails/accounts/schemas.ts` — Zod insert/update/toggle/permission schemas (lowercases the address; trims and nulls empty optionals).
- Admin UI under `src/modules/mails/accounts/ui/**` — accounts table with filter, activation switch, default badge, permission count and conversation count, plus create/edit dialog with signature, status/default switches and user assignment (multi-select). Route at `src/app/(admin)/admin/(routes)/mails/(routes)/accounts/`; sidebar entry under Mails.
- Permissions: `EMAIL_ACCOUNTS_READ` / `EMAIL_ACCOUNTS_MANAGE` and the `emailAccounts → email-accounts` area alias in `src/shared/lib/permissions.ts`.
- Coverage: `email-accounts-router.test.ts` (20) covering CRUD, the default-account constraint, user-permission replacement, per-account `getAllowed` scoping, delete guard and input validation; `authorization.test.ts` (+1) for the area alias.
- Verified: full suite (1036 tests) green, `npx tsc --noEmit` clean, scoped eslint clean.

Note: the "receiving domain" mentioned in user story 1 / Implementation Decisions is not modelled on `EmailAccount` — the canonical Prisma block in `spec.md` omits it and the schema was delivered by issue 01; inbound routing is exact match on the account address.

