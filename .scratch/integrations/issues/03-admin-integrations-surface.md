# 03: Admin integrations surface for Resend

**What to build:** La superficie amministrativa per gestire Resend: elenco delle integrazioni, modifica delle credenziali in sola scrittura, abilitazione/disabilitazione, importazione esplicita dalle env, test di connessione e stato dell'ultimo test. Le modifiche sono permesse solo a chi ha il permesso di gestione e sono registrate nell'audit con payload costruito manualmente e senza alcun valore segreto.

**Blocked by:** 02 (Integration model, Resend credential resolution, emails wiring)

**Status:** ready-for-agent

- [x] Integrations is a top-level sidebar entry (`/admin/integrations`), separate from Settings, and lists Resend as a card in a grid with its enabled state, credential presence, and last test result.
- [x] Each integration card shows the provider logo (official Resend lettermark) and opens a details dialog.
- [ ] `integrations.read` and `integrations.manage` permissions are defined and assigned to existing system roles via migration or seed.
- [ ] Secrets are write-only: they are never returned by any read operation and never pre-filled on edit.
- [ ] Secret update semantics are explicit: absent field keeps current value, `null` removes the secret, non-empty string replaces it.
- [ ] There is no reveal endpoint.
- [ ] The admin can disable Resend explicitly, and the disabled state is reflected at runtime.
- [ ] An explicit "import from environment" action copies the current Resend environment credentials into the integration without returning them to the client and invalidates per-request resolution cache.
- [ ] The connection test uses a read-only Resend operation and reports success or failure.
- [ ] The connection test is rate-limited per provider to avoid abuse of the Resend API.
- [ ] Successful and failed tests persist `lastTestedAt` and `lastTestStatus`.
- [ ] Create, update, enable/disable, import, and test produce audit entries with a manually-built payload that excludes `secretEncrypted`, `apiKey`, `webhookSecret`, and any derived secret.
- [x] Provider setup guidance is moved from email settings into the integration's own details dialog and reflects the new configuration path.
- [ ] Residual bootstrap environment variables are documented.
- [ ] Tests cover write-only reads, keep/remove/replace secret semantics, enable/disable, import, test result mapping, rate limiting, and audit redaction.
