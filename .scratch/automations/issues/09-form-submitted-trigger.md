# 09: Internal trigger event — form.submitted with caller-chosen dedup

**What to build:** The nurturing entry point. The forms module registers the internal trigger event `form.submitted` (its definition and default data appear in the node palette) and enqueues runs from its submission entry points, carrying the form data as payload. For dedup, the forms module chooses the idempotency key (e.g. the contact id) and passes it to the engine; the engine refuses to start a second non-terminal Run with the same key — the engine itself knows nothing about contacts or emails (ADR-0005).

**Blocked by:** 05

**Status:** resolved

- [x] The `form.submitted` trigger appears in the palette with a sensible default data shape; publishing requires no manual entry for the payload.
- [x] Submitting a form starts a Run whose payload carries the submitted data and the responder's email.
- [x] Submitting again for the same contact while the first Run is non-terminal does not start a second Run (one active nurture cycle), enforced via the idempotency key chosen by the forms module.
- [x] The engine code contains no contact/email concept; the semantics live in the forms module (ADR-0005).
- [x] Integration test proves the no-double-send behaviour end to end.

## Comments

Delivered:

- **Engine ingestion.** `lib/automation-events.ts` adds `enqueueEventRuns({ triggerType, payload, idempotencyKey, now })`: it walks published Automations, matches the opaque event name against a trigger node in each frozen graph, and delegates to `enqueueRun`. The payload is passed through verbatim and the idempotency key forwarded to the existing dedup, so the engine still knows nothing about forms/contacts/emails (ADR-0005).
- **Canonicalisation without domain knowledge.** `canonicalNodeType` now normalises dots to `_` and strips the `*_TRIGGER` suffix generically, so the forms module's `FORM_SUBMITTED_TRIGGER` node type and its `form.submitted` event name both canonicalise to `form_submitted` — no forms-specific aliases in the engine. `isTriggerNodeTypeName` lets publish validation accept any `*_TRIGGER` node, so a module can add a trigger without the engine listing it (`TRIGGER_NODE_TYPES` keeps the core three).
- **Forms module.** New `src/modules/forms/automations/`: `constants`, a `catalog` entry (category `trigger`, `defaultData` = the payload shape), a passthrough node registry, and `emitFormSubmitted({ formId, email, contactId, data })`. The module owns the idempotency key (`contactId`, falling back to the email). `index.ts` exposes the registry/catalog/emitter; the editor imports the client-safe `catalog` directly (same pattern as the mails module) so the `server-only` emitter never reaches the bundle.
- **Editor + runtime.** `FORM_SUBMITTED_TRIGGER` is registered as a `TriggerNode` with a clipboard icon; `AutomationNodeCatalogEntry` gained an optional `defaultData` the node selector seeds. `automation-runtime.ts` merges the forms registry with the mails one into the pump's default registry. The `submit-form` server action now calls `emitFormSubmitted` after creating the contact (errors logged, submission never blocked).
- **Tests.** `src/modules/forms/automations/__tests__/form-submitted-trigger.test.ts` covers the palette/default shape, the payload + responder email, per-contact dedup (second emit resolves to the same Run), ignoring unpublished Automations, and an end-to-end no-double-send case (two submits → one Run → one mail effect call).
- Verified: `npx tsc --noEmit` clean; full `npm run test:run` 466/466 (60 files); `npx eslint` clean on touched paths (one pre-existing `no-explicit-any` warning in `submit-form.ts`).

Non-blocking follow-ups:

- Only `src/actions/submit-form.ts` emits so far; `submit-product-form.ts`, the products submission route and `contact.ts` are other submission entry points that could call `emitFormSubmitted` in a later ticket (spec.md lists `submit-form` as the starting point).
- The published-Automation graph scan in `automation-events.ts` overlaps with the cron evaluator's loop in `automation-triggers.ts`; a shared "published graphs with node type X" helper would remove the duplication.