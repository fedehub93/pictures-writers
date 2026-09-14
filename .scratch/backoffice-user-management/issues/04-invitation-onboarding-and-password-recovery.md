# 04: Invitation onboarding and password recovery

**What to build:**
Enable authorized administrators to invite new backoffice users by email and manage pending invitations. The invited person can activate their account with a secure one-time token and can use the password-recovery flow without exposing credentials to administrators.

**Blocked by:** 01 - Permission-backed authorization foundation; 02 - Role management

**Status:** ready-for-agent

- [ ] An administrator can create an invitation with an email address and active role.
- [ ] The invitation is a separate pending entity, appears in the user-management experience, and is valid for 72 hours.
- [ ] Invitation tokens are single-use and invalidated after acceptance, cancellation, or resend.
- [ ] An administrator can resend or cancel a pending invitation.
- [ ] An invitee can set a password and optional profile details without changing the assigned role.
- [ ] A pending, expired, or cancelled invitation cannot authenticate.
- [ ] An administrator can initiate a password reset without viewing or setting the password.
- [ ] The existing email infrastructure is reused with dedicated invitation and reset messages.
