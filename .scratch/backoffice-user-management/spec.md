# Backoffice User Management

Status: ready-for-agent

## Goal

Extend the `/admin` user management into the first coherent backoffice identity and authorization module. The initial scope covers CMS backoffice users only; public-site users are out of scope.

## Domain decisions

- A backoffice user has exactly one role in the initial module.
- `ADMIN` is the only protected system role and cannot be removed or weakened below the last-admin invariants.
- `EDITOR` is a seeded, editable role and is not a protected system role.
- Roles are named sets of permissions. Role names are case-insensitively unique.
- Permissions come from a system-defined catalog. Administrators assign permissions to roles but do not create arbitrary permission keys.
- Permissions are scoped to an area and action. Initial actions are `read`, `create`, `update`, `delete`, `publish`, and `manage` where applicable.
- Initial authorization is not record-level. Dashboard widgets inherit their parent area permission; widget-specific permissions may be added later.
- Account statuses are `pending`, `active`, and `suspended`. Invitation expiry is an invitation state, not an account status.
- Physical user deletion is out of scope. Suspension disables access while retaining the account.
- An invitation is a separate pending entity. It is single-use, valid for 72 hours, and invalidated on acceptance, cancellation, or replacement by a resend.
- Expired and cancelled invitations remain historical records but cannot be used.

## Initial capabilities

### Users

- Server-side search by name and email.
- Server-side filters for role and account status.
- Server-side pagination and ordering, synchronized in URL query parameters, following the blog module patterns.
- Create an invitation with email and role.
- Resend or cancel a pending invitation.
- Edit name, surname, image, bio, email, role, and status.
- Suspend and reactivate accounts with confirmation.
- Start an administrator-initiated password reset without seeing or setting the password.
- Show the user's administrative activity history.
- Allow a user to edit their own profile and reset their own password, but not change their own role or status.

### Roles

- List roles and show assigned-user counts.
- Create a role.
- Edit role name and permission assignments.
- Deactivate a role only after all assigned users have been reassigned.
- Prevent deletion or deactivation of `ADMIN`.
- Prevent changes that would leave the system without at least one active administrator with user and role management access.

### Authorization

- Use one reusable server-side authorization policy for admin pages, tRPC procedures, and REST endpoints.
- Hide sidebar entries and UI actions when the current user lacks the relevant `read` or action permission.
- Never rely on UI hiding as the security boundary.
- Migrate new user-management operations to tRPC, while securing existing REST endpoints during the transition.

### Audit

- Record sensitive user and authorization operations.
- Store actor, action, area, target user, outcome, timestamp, and structured non-secret before/after values where applicable.
- Never store passwords, tokens, invitation links, or other secrets.
- Retain activities indefinitely in the initial module.
- Expose activity history on the user detail view; a global audit view is deferred.

## Seed and migration

- Existing `ADMIN` users receive the protected `ADMIN` role.
- Existing `EDITOR` users receive the seeded `EDITOR` role.
- Existing `USER` users remain without backoffice access.
- The seed/migration is idempotent and preserves the two current users without manual intervention.
- Existing sessions may remain valid unless the account is suspended or authorization checks reject the new state.

## Initial permission areas

Seed permissions for the existing CMS areas: dashboard, users, roles, posts/blog, pages, products/shop, forms, email, campaigns, and settings. `ADMIN` receives all permissions. `EDITOR` receives the editorial permissions selected by the seed and can be adjusted by an administrator; it receives no user, role, settings, or sensitive-data management permissions by default.

## Delivery phases

1. Data model, permission catalog, seed, migration, and shared authorization policy.
2. Role management and permission assignment.
3. User list, filters, pagination, profile editing, role changes, suspension, and reactivation.
4. Invitation acceptance, resend/cancel, and password-reset flows using the existing email infrastructure.
5. Audit persistence, user activity history, and hardening/deprecation of existing REST user endpoints.

## Verification criteria

- A suspended account cannot authenticate or use an existing authenticated request.
- A user without an area permission cannot access its page or server procedure, even if the UI is bypassed.
- A user cannot modify their own role or suspend themselves.
- The last active administrator cannot be suspended, weakened, or reassigned away from required management permissions.
- Invitation tokens are single-use, expire after 72 hours, and are invalidated when replaced or cancelled.
- User list ordering is applied before pagination and remains correct across pages.
- API responses never expose passwords, tokens, or unrelated sensitive fields.
- Existing `ADMIN` and `EDITOR` accounts retain the intended access after migration.
