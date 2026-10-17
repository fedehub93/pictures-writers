# 02: EmailAccount admin CRUD and permissions

**What to build:** An admin can create, edit, activate, deactivate, and delete `EmailAccount` records, mark exactly one account as the default, and choose which backoffice users are allowed to use each account.

**Blocked by:** 01 End-to-end inbound receiving

**Status:** ready-for-agent

- [ ] tRPC procedures exist for listing, creating, updating, and deleting `EmailAccount` records.
- [ ] Only one `EmailAccount` can be marked `isDefault` at a time; toggling default updates the previous default.
- [ ] tRPC procedures manage `EmailAccountUserPermission` assignments (which users can use which accounts).
- [ ] Deleting an account is rejected or handled safely when conversations exist.
- [ ] Admin UI lists accounts, supports create/edit forms, activation toggle, default flag, and user assignment.
- [ ] tRPC tests verify permission scoping and default-account constraint.
