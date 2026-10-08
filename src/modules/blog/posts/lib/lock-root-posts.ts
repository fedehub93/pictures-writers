import "server-only";

import { Prisma } from "@/generated/prisma";
import { acquireRootLock as acquireSharedRootLock } from "@/shared/lib/lock-root";

/**
 * Acquire a row-level lock on a `PostRoot` inside a transaction. Call this at
 * the start of any transaction that mutates the publication state of a root
 * (publish, unpublish, schedule, edit) so concurrent writers cannot interleave
 * and end up with a lost update or two live versions.
 */
export async function acquireRootLock(
  tx: Prisma.TransactionClient,
  rootId: string,
): Promise<void> {
  await acquireSharedRootLock(tx, "PostRoot", rootId);
}
