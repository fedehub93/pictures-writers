# Domain-agnostic engine: dedup via opaque idempotency key

**Status**: accepted

The automation engine must not know about CMS domain concepts (contacts, emails, forms). The nurturing use case needs "don't double-send when the same contact submits twice", but instead of a `contactEmail` column on `AutomationRun`, the trigger ingestion accepts an opaque `idempotencyKey` (string): the engine silently skips a Run when one with the same (Automation, key) already exists, and the caller decides what the key means (the forms module uses the contact id, webhook callers provide their own, cron triggers none). Domain-specific dedup and decision logic belongs in the workflow graphs or the registering module, never in the engine.

## Considered options

- **Domain-aware columns on run/step models** (`contactEmail` and friends): convenient for nurture but leaks domain semantics into the generic engine. Rejected.
- **Dedup as a registered domain node**: possible later, but requires a generic data-query channel for nodes; the idempotency key covers the MVP with far less machinery.

## Consequences

- The engine stays genuinely reusable for future automation "of any nature".
- The forms module owns nurture semantics (deciding the key) — exactly where that knowledge belongs.