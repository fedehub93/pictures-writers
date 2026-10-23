-- Remove the hardcoded single-ebook flow.
--
-- Products that still point at the legacy trigger-picker form must move to the
-- generic download form created by `20261023120000_add_digital_download_plumbing`
-- before that form is deleted, otherwise their public download CTA would lose
-- its linked form.
INSERT INTO "Form" ("id", "name", "interactionType", "updatedAt")
VALUES (
  'free-ebook-download',
  'Free ebook download',
  'ebook_downloaded',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE
SET "interactionType" = COALESCE("Form"."interactionType", EXCLUDED."interactionType");

UPDATE "ProductVersion" AS version
SET "formId" = 'free-ebook-download'
FROM "ProductRoot" AS root
WHERE version."rootId" = root."id"
  AND version."formId" = 'built-in-form-ebook'
  AND root."type" = 'EBOOK'
  AND version."acquisitionMode" = 'FORM';

-- Published automations execute a frozen JSON snapshot, so re-pointing their
-- form trigger is a separate data update. Without it, live nurture flows would
-- silently stop matching after the legacy form is removed.
UPDATE "Automation" AS automation
SET "publishedSnapshot" = jsonb_set(
  automation."publishedSnapshot",
  '{nodes}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN node.value->>'type' = 'FORM_SUBMITTED_TRIGGER'
          AND node.value->'data'->>'formId' = 'built-in-form-ebook'
          THEN jsonb_set(node.value, '{data,formId}', '"free-ebook-download"')
        ELSE node.value
      END
      ORDER BY node.ordinality
    )
    FROM jsonb_array_elements(automation."publishedSnapshot"->'nodes')
      WITH ORDINALITY AS node(value, ordinality)
  )
)
WHERE automation."publishedSnapshot"->'nodes' IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(automation."publishedSnapshot"->'nodes') AS node
    WHERE node->>'type' = 'FORM_SUBMITTED_TRIGGER'
      AND node->'data'->>'formId' = 'built-in-form-ebook'
  );

UPDATE "Node"
SET "data" = jsonb_set("data", '{formId}', '"free-ebook-download"')
WHERE "type" = 'FORM_SUBMITTED_TRIGGER'
  AND "data"->>'formId' = 'built-in-form-ebook';

-- The legacy action never wrote FormSubmission rows, and any product still
-- referencing the form has just been re-linked above. Keep the row if either
-- safety check fails so no data is lost.
DELETE FROM "Form"
WHERE "id" = 'built-in-form-ebook'
  AND NOT EXISTS (
    SELECT 1 FROM "FormSubmission" WHERE "formId" = 'built-in-form-ebook'
  )
  AND NOT EXISTS (
    SELECT 1 FROM "ProductVersion" WHERE "formId" = 'built-in-form-ebook'
  )
  AND NOT EXISTS (
    SELECT 1 FROM "Automation"
    WHERE "publishedSnapshot"::text LIKE '%built-in-form-ebook%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM "Node"
    WHERE "data"::text LIKE '%built-in-form-ebook%'
  );

-- The global free digital download template replaces the single-ebook setting.
ALTER TABLE "EmailSetting"
  DROP CONSTRAINT IF EXISTS "EmailSetting_freeEbookTemplateId_fkey";

ALTER TABLE "EmailSetting"
  DROP COLUMN IF EXISTS "freeEbookTemplateId";
