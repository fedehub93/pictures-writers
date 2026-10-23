import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATION_PATH = path.resolve(
  process.cwd(),
  "prisma/migrations/20261023130000_remove_legacy_ebook_flow/migration.sql",
);

const migrationSql = readFileSync(MIGRATION_PATH, "utf8");

let client: Client;

beforeAll(async () => {
  client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
});

afterAll(async () => {
  await client.end();
});

/**
 * Replays the cleanup migration inside a transaction against the already
 * migrated test database, then rolls back. This covers the data relink without
 * leaving rows behind.
 */
describe("remove_legacy_ebook_flow migration", () => {
  it("relinks products and automations that still use the legacy form, then deletes it", async () => {
    const rootId = randomUUID();
    const versionId = randomUUID();
    const automationId = randomUUID();
    const nodeId = randomUUID();

    await client.query("BEGIN");

    try {
      await client.query(
        `ALTER TABLE "EmailSetting" ADD COLUMN IF NOT EXISTS "freeEbookTemplateId" TEXT`,
      );
      await client.query(
        `INSERT INTO "Form" ("id", "name", "updatedAt")
         VALUES ('built-in-form-ebook', 'eBook (interno)', CURRENT_TIMESTAMP)
         ON CONFLICT ("id") DO NOTHING`,
      );
      await client.query(
        `INSERT INTO "ProductRoot" ("id", "slug", "type", "updatedAt")
         VALUES ($1, $2, 'EBOOK', CURRENT_TIMESTAMP)`,
        [rootId, `legacy-ebook-${randomUUID()}`],
      );
      await client.query(
        `INSERT INTO "ProductVersion"
           ("id", "title", "version", "rootId", "acquisitionMode", "formId", "updatedAt")
         VALUES ($1, 'Legacy free ebook', 1, $2, 'FORM', 'built-in-form-ebook', CURRENT_TIMESTAMP)`,
        [versionId, rootId],
      );
      await client.query(
        `INSERT INTO "Automation"
           ("id", "name", "status", "publishedSnapshot", "updatedAt")
         VALUES ($1, 'Legacy ebook nurture', 'PUBLISHED', $2::jsonb, CURRENT_TIMESTAMP)`,
        [
          automationId,
          JSON.stringify({
            nodes: [
              {
                id: nodeId,
                type: "FORM_SUBMITTED_TRIGGER",
                data: { formId: "built-in-form-ebook" },
              },
            ],
            connections: [],
          }),
        ],
      );
      await client.query(
        `INSERT INTO "Node" ("id", "type", "position", "data", "automationId", "updatedAt")
         VALUES ($1, 'FORM_SUBMITTED_TRIGGER', '{}'::jsonb, $2::jsonb, $3, CURRENT_TIMESTAMP)`,
        [nodeId, JSON.stringify({ formId: "built-in-form-ebook" }), automationId],
      );

      await client.query(migrationSql);

      const { rows: versionRows } = await client.query<{
        formId: string | null;
      }>(`SELECT "formId" FROM "ProductVersion" WHERE "id" = $1`, [versionId]);
      expect(versionRows[0]?.formId).toBe("free-ebook-download");

      const { rows: genericFormRows } = await client.query<{
        id: string;
        interactionType: string | null;
      }>(`SELECT "id", "interactionType" FROM "Form" WHERE "id" = $1`, [
        "free-ebook-download",
      ]);
      expect(genericFormRows[0]?.interactionType).toBe("ebook_downloaded");

      const { rows: automationRows } = await client.query<{
        publishedSnapshot: { nodes: { data: { formId: string } }[] };
      }>(`SELECT "publishedSnapshot" FROM "Automation" WHERE "id" = $1`, [
        automationId,
      ]);
      expect(
        automationRows[0]?.publishedSnapshot.nodes[0]?.data.formId,
      ).toBe("free-ebook-download");

      const { rows: nodeRows } = await client.query<{
        data: { formId: string };
      }>(`SELECT "data" FROM "Node" WHERE "id" = $1`, [nodeId]);
      expect(nodeRows[0]?.data.formId).toBe("free-ebook-download");

      const { rows: legacyFormRows } = await client.query<{ id: string }>(
        `SELECT "id" FROM "Form" WHERE "id" = 'built-in-form-ebook'`,
      );
      expect(legacyFormRows).toHaveLength(0);

      const { rows: columnRows } = await client.query<{ column_name: string }>(
        `SELECT "column_name"
         FROM information_schema.columns
         WHERE "table_name" = 'EmailSetting'
           AND "column_name" = 'freeEbookTemplateId'`,
      );
      expect(columnRows).toHaveLength(0);
    } finally {
      await client.query("ROLLBACK");
    }
  });

  it("keeps the legacy form when a submission still references it", async () => {
    const submissionId = randomUUID();

    await client.query("BEGIN");

    try {
      await client.query(
        `INSERT INTO "Form" ("id", "name", "updatedAt")
         VALUES ('built-in-form-ebook', 'eBook (interno)', CURRENT_TIMESTAMP)
         ON CONFLICT ("id") DO NOTHING`,
      );
      await client.query(
        `INSERT INTO "FormSubmission" ("id", "formId", "data", "updatedAt")
         VALUES ($1, 'built-in-form-ebook', '{}'::jsonb, CURRENT_TIMESTAMP)`,
        [submissionId],
      );

      await client.query(migrationSql);

      const { rows: legacyFormRows } = await client.query<{ id: string }>(
        `SELECT "id" FROM "Form" WHERE "id" = 'built-in-form-ebook'`,
      );
      expect(legacyFormRows).toHaveLength(1);
    } finally {
      await client.query("ROLLBACK");
    }
  });
});
