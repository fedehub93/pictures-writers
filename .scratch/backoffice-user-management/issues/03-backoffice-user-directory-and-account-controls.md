# 03: Backoffice user directory and account controls

**What to build:**
Replace the current basic user list with a permission-aware backoffice directory. Authorized administrators can search, filter, sort, paginate, edit profiles and roles, and suspend or reactivate accounts while preserving the last-administrator safeguards.

**Blocked by:** 01 - Permission-backed authorization foundation; 02 - Role management

**Status:** ready-for-agent

- [ ] The directory supports server-side search by name and email.
- [ ] The directory supports role and account-status filters.
- [ ] Ordering is applied before pagination and is synchronized in the URL.
- [ ] An authorized administrator can edit the permitted profile fields and assign an active role.
- [ ] An authorized administrator can suspend and reactivate an account with confirmation.
- [ ] A user cannot change their own role or suspend themselves.
- [ ] The last active administrator cannot be suspended or deprived of required management permissions.
- [ ] Responses exclude passwords, tokens, and unrelated sensitive fields.
