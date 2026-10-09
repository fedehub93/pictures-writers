import "server-only";

import { Prisma } from "@/generated/prisma";
import { acquireRootLock } from "@/shared/lib/lock-root";

/**
 * Acquire a row-level lock on a `ProductRoot` inside a transaction. Call this at
 * the start of any transaction that mutates the publication state of a root
 * (publish, unpublish, edit, SEO) so concurrent writers cannot interleave and
 * end up with a lost update or two live versions.
 */
export async function acquireProductRootLock(
  tx: Prisma.TransactionClient,
  rootId: string,
): Promise<void> {
  await acquireRootLock(tx, "ProductRoot", rootId);
}
