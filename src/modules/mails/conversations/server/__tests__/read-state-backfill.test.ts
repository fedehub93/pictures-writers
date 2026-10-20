import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

const accountIds: string[] = [];
const userIds: string[] = [];

async function createUser() {
  const user = await db.user.create({
    data: { email: `backfill-${randomUUID()}@example.com` },
  });
  userIds.push(user.id);
  return user;
}

async function createAccount(permittedUserIds: string[]) {
  const account = await db.emailAccount.create({
    data: {
      name: `Account ${randomUUID()}`,
      email: `backfill-${randomUUID()}@example.com`,
      userPermissions: {
        create: permittedUserIds.map((userId) => ({ userId })),
      },
    },
  });
  accountIds.push(account.id);
  return account;
}

async function createConversation(emailAccountId: string) {
  return db.conversation.create({
    data: {
      emailAccountId,
      contactEmail: `contact-${randomUUID()}@example.com`,
    },
  });
}

async function createMessage(
  conversationId: string,
  overrides: {
    direction: "INBOUND" | "OUTBOUND";
    sentAt: Date | null;
    createdAt: Date;
  },
) {
  return db.emailMessage.create({
    data: {
      conversationId,
      direction: overrides.direction,
      status: overrides.direction === "OUTBOUND" ? "SENT" : "RECEIVED",
      fromAddress: "contact@example.com",
      toAddresses: ["support@example.com"],
      ccAddresses: [],
      bccAddresses: [],
      sentAt: overrides.sentAt,
      createdAt: overrides.createdAt,
    },
  });
}

function backfillStatements() {
  const migrationsDir = path.resolve(process.cwd(), "prisma", "migrations");
  const migrationDir = readdirSync(migrationsDir).find((name) =>
    name.endsWith("_personal_conversation_read_state"),
  );

  if (!migrationDir) {
    throw new Error("Personal read state migration not found");
  }

  const sql = readFileSync(
    path.join(migrationsDir, migrationDir, "migration.sql"),
    "utf8",
  );

  return sql
    .split(";")
    .map((statement) => statement.replace(/^\s*--.*$/gm, "").trim())
    .filter(
      (statement) =>
        statement.startsWith('UPDATE "Conversation"') ||
        statement.startsWith('INSERT INTO "ConversationUserState"'),
    );
}

async function runBackfill() {
  for (const statement of backfillStatements()) {
    await db.$executeRawUnsafe(statement);
  }
}

afterEach(async () => {
  if (accountIds.length > 0) {
    await db.emailAccount.deleteMany({ where: { id: { in: accountIds } } });
  }
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  accountIds.length = 0;
  userIds.length = 0;
});

describe("personal read state migration backfill", () => {
  it("applies the schema change and drops the shared unread flag", async () => {
    const columns = await db.$queryRaw<{ column_name: string }[]>(Prisma.sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Conversation'
        AND column_name IN ('lastMessageAt', 'lastInboundAt', 'hasUnread')
    `);

    expect(columns.map((column) => column.column_name).sort()).toEqual([
      "lastInboundAt",
      "lastMessageAt",
    ]);

    const indexes = await db.$queryRaw<{ indexname: string }[]>(Prisma.sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'ConversationUserState'
    `);

    expect(indexes.map((index) => index.indexname)).toContain(
      "ConversationUserState_userId_conversationId_key",
    );
  });

  it("backfills activity timestamps and seeds read state for permitted pairs", async () => {
    const reader = await createUser();
    const secondReader = await createUser();
    const outsider = await createUser();

    const mainAccount = await createAccount([reader.id, secondReader.id]);
    const secondAccount = await createAccount([reader.id]);
    const otherAccount = await createAccount([outsider.id]);

    const conversation = await createConversation(mainAccount.id);
    await createMessage(conversation.id, {
      direction: "INBOUND",
      sentAt: new Date("2026-10-17T10:00:00.000Z"),
      createdAt: new Date("2026-10-17T10:00:00.000Z"),
    });
    await createMessage(conversation.id, {
      direction: "OUTBOUND",
      sentAt: new Date("2026-10-17T11:00:00.000Z"),
      createdAt: new Date("2026-10-17T11:00:00.000Z"),
    });
    await createMessage(conversation.id, {
      direction: "INBOUND",
      sentAt: new Date("2026-10-17T12:00:00.000Z"),
      createdAt: new Date("2026-10-17T12:00:00.000Z"),
    });

    const outboundOnly = await createConversation(secondAccount.id);
    await createMessage(outboundOnly.id, {
      direction: "OUTBOUND",
      sentAt: new Date("2026-10-17T09:00:00.000Z"),
      createdAt: new Date("2026-10-17T09:00:00.000Z"),
    });

    const noSentAt = await createConversation(secondAccount.id);
    await createMessage(noSentAt.id, {
      direction: "OUTBOUND",
      sentAt: null,
      createdAt: new Date("2026-10-17T07:30:00.000Z"),
    });

    const empty = await createConversation(mainAccount.id);

    const deleted = await db.conversation.create({
      data: {
        emailAccountId: mainAccount.id,
        contactEmail: `deleted-${randomUUID()}@example.com`,
        deletedAt: new Date("2026-10-17T13:00:00.000Z"),
      },
    });
    await createMessage(deleted.id, {
      direction: "INBOUND",
      sentAt: new Date("2026-10-17T13:00:00.000Z"),
      createdAt: new Date("2026-10-17T13:00:00.000Z"),
    });

    const notPermitted = await createConversation(otherAccount.id);
    await createMessage(notPermitted.id, {
      direction: "INBOUND",
      sentAt: new Date("2026-10-17T08:00:00.000Z"),
      createdAt: new Date("2026-10-17T08:00:00.000Z"),
    });

    await runBackfill();

    const [storedThread, storedOutboundOnly, storedNoSentAt, storedEmpty] =
      await Promise.all([
        db.conversation.findUniqueOrThrow({ where: { id: conversation.id } }),
        db.conversation.findUniqueOrThrow({ where: { id: outboundOnly.id } }),
        db.conversation.findUniqueOrThrow({ where: { id: noSentAt.id } }),
        db.conversation.findUniqueOrThrow({ where: { id: empty.id } }),
      ]);

    expect(storedThread.lastMessageAt).toEqual(
      new Date("2026-10-17T12:00:00.000Z"),
    );
    expect(storedThread.lastInboundAt).toEqual(
      new Date("2026-10-17T12:00:00.000Z"),
    );
    expect(storedOutboundOnly.lastMessageAt).toEqual(
      new Date("2026-10-17T09:00:00.000Z"),
    );
    expect(storedOutboundOnly.lastInboundAt).toBeNull();
    expect(storedNoSentAt.lastMessageAt).toEqual(
      new Date("2026-10-17T07:30:00.000Z"),
    );
    expect(storedNoSentAt.lastInboundAt).toBeNull();
    expect(storedEmpty.lastMessageAt).toBeNull();
    expect(storedEmpty.lastInboundAt).toBeNull();

    const conversationIds = [
      conversation.id,
      outboundOnly.id,
      noSentAt.id,
      empty.id,
      deleted.id,
      notPermitted.id,
    ];
    const states = await db.conversationUserState.findMany({
      where: { conversationId: { in: conversationIds } },
    });

    expect(states).toHaveLength(9);
    expect(states.every((state) => state.lastReadAt !== null)).toBe(true);
    expect(states.every((state) => state.starredAt === null)).toBe(true);

    const stateKeys = states.map(
      (state) => `${state.userId}:${state.conversationId}`,
    );
    expect(stateKeys).toEqual(
      expect.arrayContaining([
        `${reader.id}:${conversation.id}`,
        `${secondReader.id}:${conversation.id}`,
        `${reader.id}:${empty.id}`,
        `${secondReader.id}:${empty.id}`,
        `${reader.id}:${deleted.id}`,
        `${secondReader.id}:${deleted.id}`,
        `${reader.id}:${outboundOnly.id}`,
        `${reader.id}:${noSentAt.id}`,
        `${outsider.id}:${notPermitted.id}`,
      ]),
    );
    expect(stateKeys).not.toContain(`${reader.id}:${notPermitted.id}`);
  });
});
