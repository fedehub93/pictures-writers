# Keep consent out of the generic mail primitives; enforce it as a delivery policy

**Status**: accepted

Sequence emails are sent by the generic Send Email node through `sendAutomationEmail`. Unsubscribe compliance needs two things on those sends: don't deliver to a Contact whose consent is revoked, and advertise `List-Unsubscribe` so the client can one-click it. The tempting fix — a `purpose` (`marketing` | `transactional`) field on the node, plus a consent lookup inside `sendAutomationEmail` — leaks Contact semantics into a generic action and a generic send primitive, which ADR-0005 forbids ("domain-specific decision logic belongs in the workflow graphs or the registering module, never in the engine"). We keep the Send Email node, `sendAutomationEmail` and `GenericEmail` domain-agnostic. The only generic addition is `headers` passthrough on `GenericEmail` — a transport concept, not a Contact one. Consent and unsubscribe become a **sequence delivery policy** owned by the contacts domain, applied as a decorator around the `mail` effect at the single composition point (`createAutomationRuntimeEffects`). The policy reads the already-interpolated recipient from the effect request, resolves it to an `EmailContact`, suppresses the send (`{ sent: false, skipped: true }`, no log) when consent is revoked, and injects the `List-Unsubscribe` headers when the Contact exists and `NEXT_PUBLIC_APP_URL` is configured.

## Considered options

- **`purpose` on the node + guard inside `sendAutomationEmail`**: rejected. Puts marketing/transactional semantics on a generic action and makes the generic send primitive read `isSubscriber`. The escape hatch is also speculative: every current sequence email is marketing, and the known transactional emails (ebook delivery, purchase confirmations) do not go through this node.
- **Consent as a generic condition/gate node**: rejected for now. There is no generic data-query channel for nodes (ADR-0005), and it would push compliance onto the author of every sequence instead of being default-on.
- **Guard only at trigger/ingestion time** (don't start a Run for a revoked Contact): rejected as sufficient. Consent can be revoked mid-sequence, so a per-send check is still required.

## Consequences

- The engine, the Send Email node and `sendAutomationEmail` stay reusable and Contact-free; `headers` is the only generic capability added.
- The guard is explicit, isolated and testable at the policy seam in the contacts domain, instead of being diffused through the send function.
- Compliance stays default-on because the policy is composed once, where the runtime wires the mail effect. That single wiring point must not be bypassed when a new mail effect is introduced.
- `purpose`/`transactional` is not modelled on the node. A transactional send inside a sequence, if ever needed, is a future policy decision (an explicit exception), not a node property.
