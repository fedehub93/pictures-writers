-- CreateTable
CREATE TABLE "ConversationUserState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "starredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationUserState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationUserState_userId_idx" ON "ConversationUserState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationUserState_userId_conversationId_key" ON "ConversationUserState"("userId", "conversationId");

-- AddForeignKey
ALTER TABLE "ConversationUserState" ADD CONSTRAINT "ConversationUserState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationUserState" ADD CONSTRAINT "ConversationUserState_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddColumn
ALTER TABLE "Conversation" ADD COLUMN "lastMessageAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN "lastInboundAt" TIMESTAMP(3);

-- Backfill denormalized activity timestamps from the messages that already exist.
UPDATE "Conversation" AS c
SET
    "lastMessageAt" = activity."lastMessageAt",
    "lastInboundAt" = activity."lastInboundAt"
FROM (
    SELECT
        "conversationId",
        MAX(COALESCE("sentAt", "createdAt")) AS "lastMessageAt",
        MAX(
            CASE
                WHEN "direction" = 'INBOUND' THEN COALESCE("sentAt", "createdAt")
            END
        ) AS "lastInboundAt"
    FROM "EmailMessage"
    GROUP BY "conversationId"
) AS activity
WHERE activity."conversationId" = c."id";

-- Seed personal read state for every existing (user, conversation) pair among
-- permitted accounts. Existing mail is treated as read so the rollout does not
-- light up every inbox at once.
INSERT INTO "ConversationUserState" (
    "id",
    "userId",
    "conversationId",
    "lastReadAt",
    "starredAt",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    permission."userId",
    conversation."id",
    CURRENT_TIMESTAMP,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "EmailAccountUserPermission" AS permission
INNER JOIN "Conversation" AS conversation
    ON conversation."emailAccountId" = permission."emailAccountId";

-- DropColumn
ALTER TABLE "Conversation" DROP COLUMN "hasUnread";
