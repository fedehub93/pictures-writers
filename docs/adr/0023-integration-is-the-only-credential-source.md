# The Integration row is the only credential source

We store external-service credentials exclusively in the encrypted `Integration` row and never read them from environment variables at runtime. There is no fallback to `NEXT_RESEND_KEY` / `NEXT_RESEND_WEBHOOK_SECRET`, and no "import from environment" action: an unconfigured provider is an explicit "not configured" state that fails loudly until an admin pastes the credentials from the backoffice.

We chose this because two sources of truth (environment and database) produce behaviour that is hard to reason about and operate — a key can look configured while the running instance uses a different one, and rotating it requires a deploy. The cost is that an existing install that only used environment variables must paste its credentials once; we accept that one-time step in exchange for a single, auditable configuration path.

**Considered Options**
- Environment fallback when no integration row exists — rejected: two sources of truth with silent divergence.
- A one-off "import from environment" action to ease migration — rejected: it relocates the second path instead of removing it.

**Consequences**
- `Integration` is authoritative; the environment holds only infrastructure bootstrap variables (database, auth, encryption key, scheduler secret, `NEXT_PUBLIC_*`).
- Provider credential rotation is a backoffice action, never a deploy.
- The `Credential` store for automations is unaffected and remains a separate entity for arbitrary per-Node secrets.
