# 01: Permission-backed authorization foundation

**What to build:**
Introduce persistent roles and system-defined permissions for backoffice users. Migrate the existing users so `ADMIN` becomes the protected system role and `EDITOR` receives the seeded editor role. Provide one server-side authorization policy that can evaluate permissions and rejects suspended accounts.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Existing `ADMIN` and `EDITOR` users are migrated idempotently without manual intervention.
- [ ] The permission catalog covers the initial CMS areas and supported actions.
- [ ] `ADMIN` has all permissions and `EDITOR` has the seeded editorial permissions.
- [ ] A shared server-side policy evaluates role permissions consistently.
- [ ] Suspended accounts cannot authenticate or use authenticated requests.
- [ ] Existing admin access remains functional after migration.
