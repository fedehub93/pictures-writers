# 09: Internal trigger event — form.submitted with caller-chosen dedup

**What to build:** The nurturing entry point. The forms module registers the internal trigger event `form.submitted` (its definition and default data appear in the node palette) and enqueues runs from its submission entry points, carrying the form data as payload. For dedup, the forms module chooses the idempotency key (e.g. the contact id) and passes it to the engine; the engine refuses to start a second non-terminal Run with the same key — the engine itself knows nothing about contacts or emails (ADR-0005).

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] The `form.submitted` trigger appears in the palette with a sensible default data shape; publishing requires no manual entry for the payload.
- [ ] Submitting a form starts a Run whose payload carries the submitted data and the responder's email.
- [ ] Submitting again for the same contact while the first Run is non-terminal does not start a second Run (one active nurture cycle), enforced via the idempotency key chosen by the forms module.
- [ ] The engine code contains no contact/email concept; the semantics live in the forms module (ADR-0005).
- [ ] Integration test proves the no-double-send behaviour end to end.