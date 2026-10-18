# 04: Inbound webhook uses the integrated secret

**What to build:** Il webhook inbound di Resend verifica la firma con il webhook secret risolto dall'integrazione, con la stessa semantica degli altri stati. Se il segreto manca, l'endpoint risponde con uno stato "not configured" invece di un errore generico; firma invalida ed eventi non rilevanti restano distinti. L'endpoint valida anche l'header `svix-timestamp` per mitigare il replay.

**Blocked by:** 02 (Integration model, Resend credential resolution, emails wiring)

**Status:** ready-for-agent

- [ ] A valid inbound event is verified using the webhook secret resolved from the integration.
- [ ] A missing webhook secret returns a dedicated "not configured" response (HTTP 200 with explicit body) so Resend stops retrying, not a generic server error.
- [ ] An invalid signature is rejected with HTTP 400.
- [ ] A non-inbound event is acknowledged and ignored with HTTP 200.
- [ ] The `svix-timestamp` header is validated against a reasonable time window (e.g. ±5 minutes) before or during signature verification.
- [ ] Outbound sending is unaffected when the webhook secret is absent.
- [ ] No webhook secret is read from the environment once an integration row exists.
- [ ] Tests cover not-configured, invalid-signature, ignored-event, accepted-event, stale-timestamp, and future-timestamp paths.
