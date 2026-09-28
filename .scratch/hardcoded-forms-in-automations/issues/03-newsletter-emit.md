# 03: La newsletter emette form.submitted

**What to build:** Make `src/actions/subscribe.ts` emit the internal trigger event against the shadow identity `built-in-form-newsletter`.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `subscribe.ts` calls `emitFormSubmitted({ formId: <newsletter id>, email, contactId, data: { email } })`, capturing `existingContact.id` for the idempotency key.
- [ ] The emit is wrapped in `try/catch` with a log and never blocks the subscription.
- [ ] Existing behavior (`EmailContact`, interaction `user_subscribed`, subscription email, admin notification) is unchanged; **no** `FormSubmission` is written.
- [ ] A newsletter subscription starts a Run for an Automation scoped to `built-in-form-newsletter`.

## Comments
