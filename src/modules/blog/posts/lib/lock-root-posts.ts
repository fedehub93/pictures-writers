import "server-only";

import { Prisma } from "@/generated/prisma";

/**
 * Acquire a row-level lock on every version of a post root in a deterministic
 * order. Call this at the start of a transaction that mutates the editorial
 * state of a post root (schedule, reschedule, cancel, publish) to avoid lost
 * updates and concurrent scheduling of multiple versions.
 */
export async function acquireRootLock(
  tx: Prisma.TransactionClient,
  rootId: string,
): Promise<void> {
  await tx.$queryRaw`
    SELECT id FROM "Post" WHERE "rootId" = ${rootId} ORDER BY id ASC FOR UPDATE
  `;
}
