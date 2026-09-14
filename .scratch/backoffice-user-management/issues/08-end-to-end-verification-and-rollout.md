# 08: End-to-end verification and rollout

**What to build:**
Verify the complete backoffice identity and authorization module as a releasable vertical capability, covering migration, roles, permissions, account lifecycle, invitations, audit history, UI enforcement, and legacy API hardening.

**Blocked by:** 01 - Permission-backed authorization foundation; 02 - Role management; 03 - Backoffice user directory and account controls; 04 - Invitation onboarding and password recovery; 05 - Administrative activity history; 06 - Permission-aware admin surface; 07 - Legacy API hardening and authorization convergence

**Status:** ready-for-agent

- [ ] Existing `ADMIN` and `EDITOR` accounts retain the intended access after migration.
- [ ] A user without an area permission cannot access its page, action, or server procedure.
- [ ] A suspended account cannot authenticate or use an existing authenticated request.
- [ ] Invitation tokens expire, are single-use, and are invalidated when replaced or cancelled.
- [ ] The last active administrator cannot be suspended, weakened, or reassigned away from required management permissions.
- [ ] User ordering remains correct across pages and filters.
- [ ] Audit history is present for sensitive operations and contains no secrets.
- [ ] Lint, build, and the available automated/manual verification checks pass.
