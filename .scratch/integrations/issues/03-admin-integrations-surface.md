# 03: Admin integrations surface for Resend

**What to build:** La superficie amministrativa per gestire Resend: elenco delle integrazioni, modifica delle credenziali in sola scrittura, abilitazione/disabilitazione, importazione esplicita dalle env, test di connessione e stato dell'ultimo test. Le modifiche sono permesse solo a chi ha il permesso di gestione e sono registrate nell'audit con payload costruito manualmente e senza alcun valore segreto.

**Blocked by:** 02 (Integration model, Resend credential resolution, emails wiring)

**Status:** done

- [x] Integrations is a top-level sidebar entry (`/admin/integrations`), separate from Settings, and lists Resend as a card in a grid with its enabled state, credential presence, and last test result.
- [x] Each integration card shows the provider logo (official Resend lettermark) and opens a details dialog.
- [x] `integrations.read` and `integrations.manage` permissions are defined and assigned to existing system roles via migration or seed.
- [x] Secrets are write-only: they are never returned by any read operation and never pre-filled on edit.
- [x] Secret update semantics are explicit: absent field keeps current value, `null` removes the secret, non-empty string replaces it.
- [x] There is no reveal endpoint.
- [x] The admin can disable Resend explicitly, and the disabled state is reflected at runtime.
- [x] An explicit "import from environment" action copies the current Resend environment credentials into the integration without returning them to the client and invalidates per-request resolution cache.
- [x] The connection test uses a read-only Resend operation and reports success or failure.
- [x] The connection test is rate-limited per provider to avoid abuse of the Resend API.
- [x] Successful and failed tests persist `lastTestedAt` and `lastTestStatus`.
- [x] Create, update, enable/disable, import, and test produce audit entries with a manually-built payload that excludes `secretEncrypted`, `apiKey`, `webhookSecret`, and any derived secret.
- [x] Provider setup guidance is moved from email settings into the integration's own details dialog and reflects the new configuration path.
- [x] Residual bootstrap environment variables are documented.
- [x] Tests cover write-only reads, keep/remove/replace secret semantics, enable/disable, import, test result mapping, rate limiting, and audit redaction.

## Comments

Implemented. The permission migration follows the repo convention for new permissions (seeded to the `ADMIN` role only, like `automations`, `orders`, `email-accounts`); the broader seeding described in spec §14 remains a separate concern tracked in `security-review.md`.

**Partially superseded by ticket 05** (`05-remove-env-fallback-and-import.md`): the `import from environment` action (checklist item 8) and the "residual bootstrap environment variables" documentation (item 14) are removed by that ticket, because `Integration` becomes the only credential source. This ticket stays as the historical record of what was built.
