import "server-only";

import { TRPCError } from "@trpc/server";

import { db } from "@/shared/lib/db";

/**
 * Conversations are scoped by the `EmailAccountUserPermission` join row linking
 * the user to the account, not by the global area permission alone.
 */
export async function assertAccountAccess(
  userId: string,
  emailAccountId: string,
): Promise<void> {
  const permission = await db.emailAccountUserPermission.findUnique({
    where: { userId_emailAccountId: { userId, emailAccountId } },
    select: { id: true },
  });

  if (!permission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this email account",
    });
  }
}
