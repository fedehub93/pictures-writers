# 05: Administrative activity history

**What to build:**
Record sensitive operations on backoffice users, roles, and invitations, then expose the relevant history in a user’s detail view. The history must support accountability without persisting credentials or other secrets.

**Blocked by:** 02 - Role management; 03 - Backoffice user directory and account controls; 04 - Invitation onboarding and password recovery

**Status:** ready-for-agent

- [ ] Sensitive user, role, invitation, suspension, reactivation, and reset operations create activity records.
- [ ] Each record includes actor, action, area, target, outcome, and timestamp.
- [ ] Non-secret before/after values are stored in structured form when applicable.
- [ ] Passwords, tokens, invitation links, and other secrets are never stored.
- [ ] Activity records are retained indefinitely in the initial module.
- [ ] A user detail view displays that user’s activity history.
