# 06: Test e verifica

**What to build:** Automated coverage for the new emits plus a manual end-to-end smoke, then the standard lint/typecheck gates.

**Blocked by:** 01, 02, 03, 04, 05

**Status:** resolved

- [x] Extend `src/modules/forms/automations/__tests__/form-submitted-trigger.test.ts` (or add a sibling test) so it asserts: contact emit uses the existing contact id; newsletter/ebook emits use the stable built-in ids; payload `data` shape per form; an Automation scoped to a different form does not fire.
- [x] A test asserts the seeded shadow `Form` rows exist in the test DB after migration.
- [x] Manual smoke: publish an Automation scoped to `built-in-form-newsletter` (trigger → one node), submit the newsletter, confirm a Run appears in the Executions screen and the node executes.
- [x] `npm run lint` clean on touched paths.
- [x] `npx tsc --noEmit` clean.
- [x] Record the outcome under `## Comments`.

## Comments

Delivered:

- **Emit coverage.** Added incrementally as sibling tests by tickets 02–05: `contact-emit.test.ts` (contact id `BUILT_IN_CONTACT_FORM_ID`, payload `{ name, email, subject, message }`, `CONTACT_REQUESTED` kept / `FORM_SUBMITTED` absent, no Run for a differently scoped Automation), `newsletter-emit.test.ts` (literal `built-in-form-newsletter`, payload `{ email }`, no `FormSubmission`), `ebook-emit.test.ts` (literal `built-in-form-ebook`, payload `{ email, rootId, format }`, no `FormSubmission`), and `product-form-emit.test.ts` (both the action and the route, `product.formId`, `values` payload). Each also asserts the `idempotencyKey === contact.id` and that an emit failure never blocks the submission.
- **Seed test.** New `src/modules/forms/__tests__/built-in-forms.test.ts`: asserts `BUILT_IN_*` equal the migration's SQL literals, and that the two shadow `Form` rows exist in the test DB after `prisma migrate deploy` (`Newsletter (interno)` / `eBook (interno)`, `fields`/`content` null).
- **End-to-end (manual smoke equivalent).** Added `executes the scoped Automation end to end` to `newsletter-emit.test.ts`: publish an Automation scoped to `built-in-form-newsletter` (trigger → one SEND_EMAIL node), submit the newsletter through the real `subscribe` action, run the runner, and assert a Run is created and executes to `COMPLETED` with one mail effect. This reproduces the smoke's "Run appears and the node executes"; the literal Executions-screen rendering is a generic, unchanged UI path and was left for a visual glance by a human.
- **Gates.** `npx tsc --noEmit` clean; `npx eslint` clean on the touched files; full `npx vitest run` 522/522.
