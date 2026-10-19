# 04: Inbound webhook uses the integrated secret

**What to build:** Il webhook inbound di Resend verifica la firma con il webhook secret risolto dall'integrazione, con la stessa semantica degli altri stati. Se la configurazione manca — nessuna riga oppure riga senza webhook secret — l'endpoint risponde con uno stato "not configured" invece di un errore generico; firma invalida ed eventi non rilevanti restano distinti. L'endpoint valida anche l'header `svix-timestamp` per mitigare il replay.

**Blocked by:** 02 (Integration model, Resend credential resolution, emails wiring), 05 (remove env fallback and import-from-env)

**Status:** ready-for-agent

- [ ] A valid inbound event is verified using the webhook secret resolved from the integration.
- [ ] A missing webhook secret returns a dedicated "not configured" response (HTTP 200 with explicit body) so Resend stops retrying, not a generic server error.
- [ ] No integration row returns the same "not configured" response (HTTP 200).
- [ ] An invalid signature is rejected with HTTP 400.
- [ ] A non-inbound event is acknowledged and ignored with HTTP 200.
- [ ] The `svix-timestamp` header is validated against a reasonable time window (e.g. ±5 minutes) before or during signature verification.
- [ ] Outbound sending is unaffected when the webhook secret is absent.
- [ ] The webhook secret is never read from the environment; it always comes from the resolved integration.
- [ ] Tests cover not-configured (missing row and missing secret), invalid-signature, ignored-event, accepted-event, stale-timestamp, and future-timestamp paths.

## Comments

The webhook change stays in this ticket. Ticket **05** removes `NEXT_RESEND_WEBHOOK_SECRET` from the runtime path, so this ticket must not introduce (or keep) any `process.env` read for the secret.
