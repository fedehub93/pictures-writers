-- Scalable free digital downloads: generic plumbing.
--
-- `Form.interactionType` lets the download action write the right
-- `EmailContactInteraction` for the asset, so one contact can download several
-- lead magnets (the interaction table is unique on contact + type).
--
-- `EmailSetting.freeDigitalDownloadTemplateId` is the single global delivery
-- template for every free digital product. It is carried over from the legacy
-- `freeEbookTemplateId` so the existing ebook funnel keeps working while the
-- old setting is still present.
--
-- The existing free ebook gets its own shadow Form, linked through
-- `ProductVersion.formId`. This is deliberately a new row (not the legacy
-- `built-in-form-ebook` trigger-picker form, which the cleanup ticket removes)
-- so the link survives that cleanup. The update only fills the gap: it never
-- overwrites an operator's form link, and it only touches free (`FORM`) EBOOK
-- products.

ALTER TABLE "Form" ADD COLUMN IF NOT EXISTS "interactionType" TEXT;

ALTER TABLE "EmailSetting" ADD COLUMN IF NOT EXISTS "freeDigitalDownloadTemplateId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'EmailSetting_freeDigitalDownloadTemplateId_fkey'
  ) THEN
    ALTER TABLE "EmailSetting"
      ADD CONSTRAINT "EmailSetting_freeDigitalDownloadTemplateId_fkey"
      FOREIGN KEY ("freeDigitalDownloadTemplateId")
      REFERENCES "EmailTemplate"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

UPDATE "EmailSetting"
SET "freeDigitalDownloadTemplateId" = "freeEbookTemplateId"
WHERE "freeDigitalDownloadTemplateId" IS NULL
  AND "freeEbookTemplateId" IS NOT NULL;

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
  AND root."type" = 'EBOOK'
  AND version."acquisitionMode" = 'FORM'
  AND version."formId" IS NULL;
