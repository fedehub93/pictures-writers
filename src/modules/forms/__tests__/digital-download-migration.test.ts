import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATION_PATH = path.resolve(
  process.cwd(),
  "prisma/migrations/20261023120000_add_digital_download_plumbing/migration.sql",
);

const migrationSql = readFileSync(MIGRATION_PATH, "utf8");

const MIGRATED_FORM_ID = "free-ebook-download";

let client: Client;

beforeAll(async () => {
  client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
});

afterAll(async () => {
  await client.end();
});

/**
 * The migration is replayed inside a transaction against the already-migrated
 * test database, then rolled back. This exercises the data backfill (shadow
 * form interaction type, product link, template carry-over) without leaving
 * any rows behind.
 */
describe("add_digital_download_plumbing migration", () => {
  it("links existing free ebooks to the shadow form and carries the template over", async () => {
    const templateId = randomUUID();
    const settingsId = randomUUID();
    const ebookRootId = randomUUID();
    const ebookVersionId = randomUUID();
    const linkedRootId = randomUUID();
    const linkedVersionId = randomUUID();
    const paidRootId = randomUUID();
    const paidVersionId = randomUUID();
    const serviceRootId = randomUUID();
    const serviceVersionId = randomUUID();

    await client.query("BEGIN");

    try {
      // The cleanup migration removes the legacy column and shadow form. Put
      // them back inside this transaction so the original migration can be
      // replayed and exercised against its historical schema.
      await client.query(
        `ALTER TABLE "EmailSetting" ADD COLUMN IF NOT EXISTS "freeEbookTemplateId" TEXT`,
      );
      await client.query(
        `INSERT INTO "Form" ("id", "name", "updatedAt")
         VALUES ('built-in-form-ebook', 'eBook (interno)', CURRENT_TIMESTAMP)
         ON CONFLICT ("id") DO NOTHING`,
      );

      await client.query(
        `INSERT INTO "EmailTemplate" ("id", "name", "updatedAt")
         VALUES ($1, 'Legacy ebook template', CURRENT_TIMESTAMP)`,
        [templateId],
      );
      await client.query(
        `INSERT INTO "EmailSetting" ("id", "freeEbookTemplateId", "updatedAt")
         VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [settingsId, templateId],
      );

      await client.query(
        `UPDATE "Form" SET "interactionType" = NULL
         WHERE "id" = 'built-in-form-ebook'`,
      );

      await client.query(
        `INSERT INTO "ProductRoot" ("id", "slug", "type", "updatedAt")
         VALUES ($1, $2, 'EBOOK', CURRENT_TIMESTAMP)`,
        [ebookRootId, `free-ebook-${randomUUID()}`],
      );
      await client.query(
        `INSERT INTO "ProductVersion"
           ("id", "title", "version", "rootId", "acquisitionMode", "updatedAt")
         VALUES ($1, 'Free ebook', 1, $2, 'FORM', CURRENT_TIMESTAMP)`,
        [ebookVersionId, ebookRootId],
      );

      await client.query(
        `INSERT INTO "ProductRoot" ("id", "slug", "type", "updatedAt")
         VALUES ($1, $2, 'EBOOK', CURRENT_TIMESTAMP)`,
        [linkedRootId, `linked-ebook-${randomUUID()}`],
      );
      await client.query(
        `INSERT INTO "ProductVersion"
           ("id", "title", "version", "rootId", "acquisitionMode", "formId", "updatedAt")
         VALUES ($1, 'Already linked ebook', 1, $2, 'FORM', 'built-in-form-ebook', CURRENT_TIMESTAMP)`,
        [linkedVersionId, linkedRootId],
      );

      await client.query(
        `INSERT INTO "ProductRoot" ("id", "slug", "type", "updatedAt")
         VALUES ($1, $2, 'EBOOK', CURRENT_TIMESTAMP)`,
        [paidRootId, `paid-ebook-${randomUUID()}`],
      );
      await client.query(
        `INSERT INTO "ProductVersion"
           ("id", "title", "version", "rootId", "acquisitionMode", "updatedAt")
         VALUES ($1, 'Paid ebook', 1, $2, 'PAID', CURRENT_TIMESTAMP)`,
        [paidVersionId, paidRootId],
      );

      await client.query(
        `INSERT INTO "ProductRoot" ("id", "slug", "type", "updatedAt")
         VALUES ($1, $2, 'SERVICE', CURRENT_TIMESTAMP)`,
        [serviceRootId, `service-${randomUUID()}`],
      );
      await client.query(
        `INSERT INTO "ProductVersion"
           ("id", "title", "version", "rootId", "acquisitionMode", "updatedAt")
         VALUES ($1, 'Service', 1, $2, 'FORM', CURRENT_TIMESTAMP)`,
        [serviceVersionId, serviceRootId],
      );

      await client.query(migrationSql);
      await client.query(migrationSql);

      const { rows: ebookRows } = await client.query<{ formId: string | null }>(
        `SELECT "formId" FROM "ProductVersion" WHERE "id" = $1`,
        [ebookVersionId],
      );
      expect(ebookRows[0]?.formId).toBe(MIGRATED_FORM_ID);

      const { rows: linkedRows } = await client.query<{
        formId: string | null;
      }>(
        `SELECT "formId" FROM "ProductVersion" WHERE "id" = $1`,
        [linkedVersionId],
      );
      expect(linkedRows[0]?.formId).toBe("built-in-form-ebook");

      const { rows: paidRows } = await client.query<{ formId: string | null }>(
        `SELECT "formId" FROM "ProductVersion" WHERE "id" = $1`,
        [paidVersionId],
      );
      expect(paidRows[0]?.formId).toBeNull();

      const { rows: serviceRows } = await client.query<{
        formId: string | null;
      }>(
        `SELECT "formId" FROM "ProductVersion" WHERE "id" = $1`,
        [serviceVersionId],
      );
      expect(serviceRows[0]?.formId).toBeNull();

      const { rows: formRows } = await client.query<{
        interactionType: string | null;
      }>(
        `SELECT "interactionType" FROM "Form" WHERE "id" = $1`,
        [MIGRATED_FORM_ID],
      );
      expect(formRows[0]?.interactionType).toBe("ebook_downloaded");

      const { rows: legacyFormRows } = await client.query<{
        interactionType: string | null;
      }>(
        `SELECT "interactionType" FROM "Form" WHERE "id" = 'built-in-form-ebook'`,
      );
      expect(legacyFormRows[0]?.interactionType).toBeNull();

      const { rows: settingRows } = await client.query<{
        freeDigitalDownloadTemplateId: string | null;
      }>(
        `SELECT "freeDigitalDownloadTemplateId" FROM "EmailSetting" WHERE "id" = $1`,
        [settingsId],
      );
      expect(settingRows[0]?.freeDigitalDownloadTemplateId).toBe(templateId);
    } finally {
      await client.query("ROLLBACK");
    }
  });
});
