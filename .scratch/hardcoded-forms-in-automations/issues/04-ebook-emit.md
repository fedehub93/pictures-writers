# 04: Il download ebook emette form.submitted

**What to build:** Make `src/actions/subscribe-free-ebook.ts` emit the internal trigger event against the shadow identity `built-in-form-ebook`. Both UI entry points (the ebook modal and the product-pop widget) share this action, so one emit covers both.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `subscribe-free-ebook.ts` calls `emitFormSubmitted({ formId: <ebook id>, email, contactId, data: { email, rootId, format } })`, capturing `existingContact.id` for the idempotency key.
- [ ] The emit is wrapped in `try/catch` with a log and never blocks the download flow.
- [ ] Existing behavior (`EmailContact`, interaction `ebook_downloaded`, ebook email, provider contact sync, admin notification) is unchanged; **no** `FormSubmission` is written.
- [ ] An ebook download from either UI starts a Run for an Automation scoped to `built-in-form-ebook`.

## Comments
