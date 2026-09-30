# 05: I form prodotto emettono form.submitted

**What to build:** Close the same gap on the product-form submission paths, which write a `FormSubmission` but never emit. They are already dynamic (they resolve `product.formId`), so this is the same one-line pattern as the other actions.

**Blocked by:** —

**Status:** resolved

- [x] `src/actions/submit-product-form.ts` calls `emitFormSubmitted({ formId: product.formId, email, contactId, data: values })` after creating the contact, capturing `contact.id` for the idempotency key.
- [x] `src/app/api/products/[rootId]/submission/route.ts` does the same (creating/looking up the contact if needed so it can pass `contactId`).
- [x] The emit is wrapped in `try/catch` with a log and never blocks the submission.
- [x] Existing behavior (`FormSubmission`, `handleFormSubmitted`) is unchanged.
- [x] A product-form submission starts a Run for an Automation scoped to that product's form.

## Comments

Delivered:

- `src/actions/submit-product-form.ts` captures `contact = await createContactByEmail(emailFromBody, "submit_product_form")` and emits `emitFormSubmitted({ formId: product.formId, email: emailFromBody, contactId: contact?.id ?? null, data: values })` inside a `try/catch` (log only, never blocking), mirroring `submit-form.ts` / `contact.ts`. The `FormSubmission` write and `handleFormSubmitted()` are untouched.
- `src/app/api/products/[rootId]/submission/route.ts` now creates/looks up the contact (`createContactByEmail(emailFromBody, "submit_product_form")`) and performs the same emit with `data: body`. Because `EmailContact.email` is non-nullable, the contact + emit are guarded by `if (emailFromBody)`, so an address-less body keeps the previous behaviour (200 with the stored submission, no contact, no emit) instead of regressing to a 500.
- Coverage added as a sibling test `src/modules/forms/automations/__tests__/product-form-emit.test.ts` (allowed by ticket 06's "or add a sibling test") covering both entry points: Run starts scoped to the product's `formId` with `idempotencyKey === contact.id`, payload `data` shape, unchanged `FormSubmission` + `handleFormSubmitted`, no Run for a differently scoped Automation, emit failure never blocks the submission, and the route's email-less fallback. Both the action and the route start a Run for an Automation scoped to that product's form.
- Verified: `npx vitest run` 519/519; `npx tsc --noEmit` clean; `npx eslint` clean on touched files (only two pre-existing warnings in `submit-product-form.ts`).
