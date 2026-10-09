import "server-only";

import { Prisma } from "@/generated/prisma";

/**
 * Root tables that can be locked for a publication transition. Kept as a union
 * so the table name can never be interpolated from user input.
 */
export type RootLockTable = "PageRoot" | "PostRoot" | "ProductRoot";

/**
 * Acquire a `SELECT ... FOR UPDATE` row lock on a root inside a transaction.
 *
 * Call this at the start of any transaction that mutates the publication state
 * of a root (publish, unpublish, schedule, edit) so concurrent writers cannot
 * interleave and end up with a lost update or two live versions. Shared by the
 * Page, Post and Product root/version models so all serialize the same way.
 */
export async function acquireRootLock(
  tx: Prisma.TransactionClient,
  table: RootLockTable,
  rootId: string,
): Promise<void> {
  await tx.$queryRawUnsafe(
    `SELECT id FROM "${table}" WHERE id = $1 FOR UPDATE`,
    rootId,
  );
}
