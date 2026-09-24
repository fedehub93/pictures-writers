# 07: Domain action — Send Email (registered by the mails module)

**What to build:** The one domain action in the MVP catalogue, contributed by the mails module through the node registry. The node takes a recipient (any address, or the responder's address from the run payload), subject, and body — authorable once, with template expressions for the dynamic parts — and sends through the existing mail pipeline (provider adapters, mail settings, send log). Sends are idempotent per (run, step) so retries never double-send, and are audited via the existing send log. A node configuration panel lives with the mails module's admin UI.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] The Send Email node appears in the palette under actions, contributed by the mails module without touching the engine.
- [ ] Executing it sends a real email through the existing mail pipeline using the mail settings; success/failure is reflected in the Step ledger.
- [ ] A retried Step does not send twice (idempotency per run/step); sends are recorded in the existing send log.
- [ ] Recipient/subject/body fully support template expressions from the run payload and predecessor outputs.
- [ ] Tests exercise it with an in-memory mail recorder; no real messages are sent in tests.