# 05: I form prodotto emettono form.submitted

**What to build:** Close the same gap on the product-form submission paths, which write a `FormSubmission` but never emit. They are already dynamic (they resolve `product.formId`), so this is the same one-line pattern as the other actions.

**Blocked by:** —

**Status:** ready-for-agent

- [ ] `src/actions/submit-product-form.ts` calls `emitFormSubmitted({ formId: product.formId, email, contactId, data: values })` after creating the contact, capturing `contact.id` for the idempotency key.
- [ ] `src/app/api/products/[rootId]/submission/route.ts` does the same (creating/looking up the contact if needed so it can pass `contactId`).
- [ ] The emit is wrapped in `try/catch` with a log and never blocks the submission.
- [ ] Existing behavior (`FormSubmission`, `handleFormSubmitted`) is unchanged.
- [ ] A product-form submission starts a Run for an Automation scoped to that product's form.

## Comments
