# 01: Identità stabile dei form ombra (migration + costanti)

**What to build:** Create the two shadow `Form` rows that exist only to be selectable in the `form.submitted` trigger picker, with environment-stable ids. Add a single shared constants module for the built-in ids and add the durable `Form` glossary term.

**Blocked by:** —

**Status:** resolved

- [x] A Prisma data migration inserts `Form` rows `built-in-form-newsletter` (name `Newsletter (interno)`) and `built-in-form-ebook` (name `eBook (interno)`), only the required columns (`id`, `name`, `updatedAt`); `fields`/`content` stay `NULL`.
- [x] The migration is idempotent (`ON CONFLICT DO NOTHING`), so it is safe to replay, following `prisma/migrations/20260913100000_permission_backed_authorization`.
- [x] A shared constants module in the forms module exposes the built-in form ids (and the existing contact id), used by the emitting actions.
- [x] The rows appear in `forms.getMany` and therefore in the `FormSubmittedTriggerConfigPanel` select.
- [x] `CONTEXT.md` gains a durable `Form` term (glossary only, no implementation detail, no ADR).
- [x] `npx prisma generate`/`migrate` succeed; the rows exist in the test DB.

## Comments

Delivered:

- **Migration.** `prisma/migrations/20260928120000_seed_built_in_forms/migration.sql` seeds the two shadow Forms with only `id`, `name`, `updatedAt` (`createdAt` takes the table default); `fields`/`content` stay `NULL`. Plain `INSERT ... ON CONFLICT ("id") DO NOTHING` so it is idempotent and never overwrites operator edits; a replay through `prisma db execute` succeeded.
- **Constants.** `src/modules/forms/built-in-forms.ts` is the single application-code source of truth for the ids: `BUILT_IN_CONTACT_FORM_ID` (existing `/contatti` dynamic form), `BUILT_IN_NEWSLETTER_FORM_ID`, `BUILT_IN_EBOOK_FORM_ID`. The migration header documents the mirrored SQL literals. `src/actions/contact.ts` now writes `BUILT_IN_CONTACT_FORM_ID` instead of the magic GUID (behaviour unchanged); tickets 03/04/05 consume the other two.
- **Picker.** `forms.getMany` has no name filter, so the two rows surface in `FormSubmittedTriggerConfigPanel` with no code change; the forms admin list accepts the visibility for now (spec Out of Scope).
- **Glossary.** `CONTEXT.md` gains the durable `Form` term under a new `## Forms` section.
- Verified: `npx prisma generate` and `prisma migrate deploy` (test DB) succeeded; the two rows exist with `fields`/`content` null; full `vitest run` 501/501; `npx tsc --noEmit` clean; `npx eslint` clean on touched files.

Next tickets (02–06) add the emits and the automated coverage.
