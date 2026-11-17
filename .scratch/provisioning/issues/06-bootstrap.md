# 06 — Bootstrap and closed sign-up

Status: ready-for-agent
Blocked by: 03

## Problem

There is no way to create the first backoffice user without a terminal: production's first admin came from a database dump. Public sign-up is currently open (`disableSignUp` unset), so a freshly provisioned Installation accepts anyone who knows its URL.

## What

- `POST /api/bootstrap/`, guarded by `BOOTSTRAP_SECRET`: creates the first user through Better Auth's own API (`auth.api.signUpEmail`), assigns the admin role through the RBAC tables, writes `Settings.siteUrl`, marks the secret spent, and refuses the call afterwards.
- Never hash a password or insert a user from outside the app: Better Auth uses scrypt and owns that policy.
- `disableSignUp: true` in both auth configurations, kept in sync (`src/shared/lib/auth.ts`, `src/lib/auth.ts`). Invitations remain the only other way in.
- `Settings.siteUrl` is read-only in the backoffice, with a note that the domain is managed from the hosting panel.
- Bootstrap is idempotent in the sense that a second call fails cleanly; it never creates a second admin.

## Done when

- A fresh image plus an empty database yields a working admin login with no SQL and no terminal.
- Sign-up via `/api/auth/[...all]` is refused; an invitation still works end to end.
- The second bootstrap call returns an error and creates nothing.

## Production impact

Safe. Existing users and sessions are unaffected by `disableSignUp`; invitation acceptance keeps working. The endpoint is additive and spent on first use.
