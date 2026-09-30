# 04: Il download ebook emette form.submitted

**What to build:** Make `src/actions/subscribe-free-ebook.ts` emit the internal trigger event against the shadow identity `built-in-form-ebook`. Both UI entry points (the ebook modal and the product-pop widget) share this action, so one emit covers both.

**Blocked by:** 01

**Status:** resolved

- [x] `subscribe-free-ebook.ts` calls `emitFormSubmitted({ formId: <ebook id>, email, contactId, data: { email, rootId, format } })`, capturing `existingContact.id` for the idempotency key.
- [x] The emit is wrapped in `try/catch` with a log and never blocks the download flow.
- [x] Existing behavior (`EmailContact`, interaction `ebook_downloaded`, ebook email, provider contact sync, admin notification) is unchanged; **no** `FormSubmission` is written.
- [x] An ebook download from either UI starts a Run for an Automation scoped to `built-in-form-ebook`.

## Comments

Delivered:

- `src/actions/subscribe-free-ebook.ts` captures `existingContact = await createContactByEmail(email, "ebook_downloaded")` and emits `emitFormSubmitted({ formId: BUILT_IN_EBOOK_FORM_ID, email, contactId: existingContact.id, data: { email, rootId: rootId!, format } })` inside a `try/catch` (log only, never blocking), mirroring `contact.ts` / `subscribe.ts`. The `ebook_downloaded` interaction, the free-ebook email, `handleEbookDownloaded()` and the provider contact sync are unchanged; no `FormSubmission` is written. Both UI entry points (the modal and the product-pop widget) share this action, so one emit covers both.
- Coverage added as a sibling test `src/modules/forms/automations/__tests__/ebook-emit.test.ts` (allowed by ticket 06's "or add a sibling test"): asserts the Run starts scoped to `built-in-form-ebook` with `idempotencyKey === contact.id`, payload `data` shape `{ email, rootId, format }`, the `ebook_downloaded` interaction + notification + provider sync are kept, no `FormSubmission` row exists, no Run for a differently scoped Automation, and that an emit failure never blocks the download.
- Verified: `npx tsc --noEmit` clean; `npx eslint` clean on touched files.
