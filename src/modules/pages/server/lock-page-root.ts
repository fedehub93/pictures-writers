import "server-only";

import { Prisma } from "@/generated/prisma";
import { acquireRootLock } from "@/shared/lib/lock-root";

/**
 * Acquire a row-level lock on a `PageRoot` inside a transaction. Call this at
 * the start of any transaction that mutates the publication state of a root
 * (publish, unpublish, edit) so concurrent writers cannot interleave and end
 * up with a lost update or two live versions.
 */
export async function acquirePageRootLock(
  tx: Prisma.TransactionClient,
  rootId: string,
): Promise<void> {
  await acquireRootLock(tx, "PageRoot", rootId);
}
