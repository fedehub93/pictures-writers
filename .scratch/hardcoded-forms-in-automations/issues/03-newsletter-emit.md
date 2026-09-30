# 03: La newsletter emette form.submitted

**What to build:** Make `src/actions/subscribe.ts` emit the internal trigger event against the shadow identity `built-in-form-newsletter`.

**Blocked by:** 01

**Status:** resolved

- [x] `subscribe.ts` calls `emitFormSubmitted({ formId: <newsletter id>, email, contactId, data: { email } })`, capturing `existingContact.id` for the idempotency key.
- [x] The emit is wrapped in `try/catch` with a log and never blocks the subscription.
- [x] Existing behavior (`EmailContact`, interaction `user_subscribed`, subscription email, admin notification) is unchanged; **no** `FormSubmission` is written.
- [x] A newsletter subscription starts a Run for an Automation scoped to `built-in-form-newsletter`.

## Comments

Delivered:

- `src/actions/subscribe.ts` captures `existingContact = await createContactByEmail(email, "user_subscribed")` and emits `emitFormSubmitted({ formId: BUILT_IN_NEWSLETTER_FORM_ID, email, contactId: existingContact.id, data: { email } })` inside a `try/catch` (log only, never blocking), mirroring `contact.ts` / `submit-form.ts`. `handleUserSubscribed()`, the subscription token/email and the provider interaction are unchanged; no `FormSubmission` is written.
- Coverage added as a sibling test `src/modules/forms/automations/__tests__/newsletter-emit.test.ts` (allowed by ticket 06's "or add a sibling test"): asserts the Run starts scoped to `built-in-form-newsletter` with `idempotencyKey === contact.id`, payload `data` shape `{ email }`, the `user_subscribed` interaction and admin notification are kept, no `FormSubmission` row exists, no Run for a differently scoped Automation, and that an emit failure never blocks the subscription.
- Verified: `npx vitest run` 509/509; `npx tsc --noEmit` clean; `npx eslint` clean on touched files.
