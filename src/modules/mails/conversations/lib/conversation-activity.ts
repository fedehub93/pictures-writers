import "server-only";

import { Prisma } from "@/generated/prisma";

type Executor = {
  $executeRaw(query: Prisma.Sql): Promise<number>;
};

/**
 * Stamp a conversation's denormalized activity timestamps. `GREATEST` keeps
 * them monotonic, so a delayed or out-of-order message cannot move the thread
 * backwards or hide itself from the unread comparison.
 */
export async function stampConversationActivity(
  client: Executor,
  params: { conversationId: string; at: Date; inbound?: boolean },
): Promise<void> {
  const { conversationId, at, inbound = false } = params;

  await client.$executeRaw(
    inbound
      ? Prisma.sql`
          UPDATE "Conversation"
          SET
            "lastMessageAt" = GREATEST(COALESCE("lastMessageAt", ${at}), ${at}),
            "lastInboundAt" = GREATEST(COALESCE("lastInboundAt", ${at}), ${at}),
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${conversationId}
        `
      : Prisma.sql`
          UPDATE "Conversation"
          SET
            "lastMessageAt" = GREATEST(COALESCE("lastMessageAt", ${at}), ${at}),
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${conversationId}
        `,
  );
}
