-- Seed the shadow Forms for submission entry points that are still hardcoded
-- (newsletter widget, eBook download). They render nowhere and carry no fields:
-- they exist only so the `form.submitted` trigger picker (`forms.getMany`) can
-- list and scope to them. The ids are stable and mirrored by the shared
-- constants module `src/modules/forms/built-in-forms.ts`.
--
-- Plain INSERT ... ON CONFLICT DO NOTHING keeps the migration idempotent and
-- safe to replay, and never overwrites an operator's edits to name/fields.
INSERT INTO "Form" ("id", "name", "updatedAt")
VALUES
  ('built-in-form-newsletter', 'Newsletter (interno)', CURRENT_TIMESTAMP),
  ('built-in-form-ebook', 'eBook (interno)', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
