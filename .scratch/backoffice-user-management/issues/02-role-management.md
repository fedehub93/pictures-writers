# 02: Role management

**What to build:**
Give authorized administrators a complete role-management experience: view roles and assigned-user counts, create roles, rename roles, and assign permissions from the system catalog. Protect `ADMIN` and enforce the last-administrator invariants.

**Blocked by:** 01 - Permission-backed authorization foundation

**Status:** ready-for-agent

- [ ] An authorized administrator can list roles and see assigned-user counts.
- [ ] An authorized administrator can create a role with a unique name.
- [ ] An authorized administrator can rename a role and change its permissions.
- [ ] Permission choices come only from the system-defined catalog.
- [ ] Role names are unique without case sensitivity.
- [ ] `ADMIN` cannot be removed, deactivated, or weakened below required management access.
- [ ] A role with assigned users cannot be deactivated until those users are reassigned.
