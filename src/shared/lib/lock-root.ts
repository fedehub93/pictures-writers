import "server-only";

import { Prisma } from "@/generated/prisma";

/**
 * Root tables that can be locked for a publication transition. Kept as a union
 * so the table name can never be interpolated from user input.
 */
export type RootLockTable =
  | "PageRoot"
  | "PostRoot"
  | "ProductRoot"
  | "SiteRegion";

/**
 * Acquire a `SELECT ... FOR UPDATE` row lock on a root inside a transaction.
 *
 * Call this at the start of any transaction that mutates the publication state
 * of a root (publish, unpublish, schedule, edit) so concurrent writers cannot
 * interleave and end up with a lost update or two live versions. Shared by the
 * Page, Post, Product and Site region root/version models so all serialize the
 * same way.
 */
export async function acquireRootLock(
  tx: Prisma.TransactionClient,
  table: RootLockTable,
  rootId: string,
): Promise<void> {
  // One static query per table: the identifier is never interpolated and the
  // id stays a bound parameter. Add a case here when extending RootLockTable.
  switch (table) {
    case "PageRoot":
      await tx.$queryRaw`SELECT id FROM "PageRoot" WHERE id = ${rootId} FOR UPDATE`;
      return;
    case "PostRoot":
      await tx.$queryRaw`SELECT id FROM "PostRoot" WHERE id = ${rootId} FOR UPDATE`;
      return;
    case "ProductRoot":
      await tx.$queryRaw`SELECT id FROM "ProductRoot" WHERE id = ${rootId} FOR UPDATE`;
      return;
    case "SiteRegion":
      await tx.$queryRaw`SELECT id FROM "SiteRegion" WHERE id = ${rootId} FOR UPDATE`;
      return;
    default: {
      const unexpectedTable: never = table;
      throw new Error(`Unsupported root lock table: ${unexpectedTable}`);
    }
  }
}
