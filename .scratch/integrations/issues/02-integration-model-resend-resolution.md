# 02: Integration model, Resend credential resolution, emails wiring

**What to build:** Il modello `Integration` e il percorso completo che porta una credenziale Resend dal database all'invio email. Se non esiste una riga l'installazione usa le env; se la riga esiste il database vince; se è disabilitata o incompleta l'invio fallisce con un errore esplicito. L'adapter riceve la chiave per iniezione, il modulo `mail.ts` smette di creare un client Resend diretto, e nessun segreto viene letto da codice client.

**Blocked by:** 01 (Shared secrets encryption)

**Status:** done

- [x] An `Integration` row exists per provider, with unique provider key, enabled flag, non-secret configuration, encrypted secrets, and last-test metadata.
- [x] The provider key is a validated string, not a database enum.
- [x] No integration row means the existing environment behaviour is preserved.
- [x] An enabled integration row supplies the Resend API key from the database.
- [x] A disabled integration row fails explicitly and never falls back to the environment.
- [x] An enabled but incomplete integration row fails explicitly and names the missing field.
- [x] The Resend webhook secret is optional; outbound sending works without it.
- [x] The Resend adapter constructor accepts `apiKey` as an argument and never reads `process.env`.
- [x] `sendResendEmail` and any other mail helper use `resolveAdapter()` instead of instantiating `new Resend(process.env.NEXT_RESEND_KEY)`.
- [x] Outbound Resend sending no longer requires `EmailSetting.emailApiKey` and does not read the API key from the environment.
- [x] `EmailSetting.emailProvider` remains the provider selector; sender identity, daily cap, and templates remain in `EmailSetting`.
- [x] No integration secret is readable from client code.
- [x] Resolution is not cached across requests; per-request memoization is invalidated on import.
- [x] Secret update semantics are explicit: absent field keeps current value, `null` removes the secret, non-empty string replaces it.
- [x] Tests cover no-row, enabled, disabled, incomplete, malformed-ciphertext, secret-removal, and adapter construction states.

## Comments

Implemented in the current branch.

Key changes:
- Added `Integration` Prisma model with migration `20261018142952_add_integration_model`.
- Added `src/modules/integrations/lib/` with constants, types, secrets helpers, and `resolveIntegrationSecrets`.
- Resend resolution: no row → env fallback; enabled row → DB key; disabled → explicit error; incomplete → names missing `apiKey`; webhook secret optional.
- `ResendAdapter` constructor now accepts `{ apiKey }` and never reads `process.env`.
- `resolveAdapter` reads `EmailSetting.emailProvider`, resolves integration credentials, and injects them into the adapter.
- `sendResendEmail` and `sendSingleSend` use `resolveAdapter()` instead of reading `NEXT_RESEND_KEY` or `EmailSetting.emailApiKey`.
- Added tests for resolution states, secret update semantics, adapter construction, and provider resolution.

Full test suite: 1171 tests passing.

**Partially superseded by ticket 05** (`05-remove-env-fallback-and-import.md`): the resolver no longer falls back to the environment when no row exists — it reports "not configured" — and per-request cache invalidation on import is gone. The body above records what was built at the time.
