# 02: Il form contatti della home emette form.submitted

**What to build:** Make `src/actions/contact.ts` emit the internal trigger event against the **existing** dynamic contact form id (`cad10953-192a-423f-9d75-852a2b26034f`, the form selected by the Puck page `/contatti`). Do not create a new form row and do not touch the id.

**Blocked by:** —

**Status:** resolved

- [ ] `contact.ts` calls `emitFormSubmitted({ formId: <contact id>, email, contactId, data: { name, email, subject, message } })` after creating/looking up the contact, capturing `contact.id` for the idempotency key.
- [ ] The emit is wrapped in `try/catch` with a log and never blocks the submission (mirrors `src/actions/submit-form.ts:73-82`).
- [ ] `handleContactRequested()` (`CONTACT_REQUESTED` notification) is kept; `handleFormSubmitted()` is **not** added.
- [ ] No `FormSubmission`-related behavior changes.
- [ ] A submission from the home contact form starts a Run for an Automation scoped to the contact form.

## Comments

Delivered (commit `1bbca8d`):

- `src/actions/contact.ts` now captures `contact = await createContactByEmail(...)` and emits `emitFormSubmitted({ formId: BUILT_IN_CONTACT_FORM_ID, email, contactId: contact?.id ?? null, data: { name, email, subject, message } })` inside a `try/catch` (log only, never blocking), mirroring `submit-form.ts:73-82`. The `FormSubmission` write is untouched and `handleContactRequested()` is kept; `handleFormSubmitted()` is not added.
- Coverage added as a sibling test `src/modules/forms/automations/__tests__/contact-emit.test.ts` (allowed by ticket 06's "or add a sibling test"): asserts the Run starts scoped to the existing contact form id with `idempotencyKey === contact.id`, payload `data` shape, `CONTACT_REQUESTED` kept / `FORM_SUBMITTED` absent, no Run for a differently scoped Automation, and that an emit failure never blocks the submission.
- Verified: `npx vitest run` 505/505; `npx tsc --noEmit` clean; `npx eslint` clean on touched files.
