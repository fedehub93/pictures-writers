# 02: Il form contatti della home emette form.submitted

**What to build:** Make `src/actions/contact.ts` emit the internal trigger event against the **existing** dynamic contact form id (`cad10953-192a-423f-9d75-852a2b26034f`, the form selected by the Puck page `/contatti`). Do not create a new form row and do not touch the id.

**Blocked by:** —

**Status:** ready-for-agent

- [ ] `contact.ts` calls `emitFormSubmitted({ formId: <contact id>, email, contactId, data: { name, email, subject, message } })` after creating/looking up the contact, capturing `contact.id` for the idempotency key.
- [ ] The emit is wrapped in `try/catch` with a log and never blocks the submission (mirrors `src/actions/submit-form.ts:73-82`).
- [ ] `handleContactRequested()` (`CONTACT_REQUESTED` notification) is kept; `handleFormSubmitted()` is **not** added.
- [ ] No `FormSubmission`-related behavior changes.
- [ ] A submission from the home contact form starts a Run for an Automation scoped to the contact form.

## Comments
