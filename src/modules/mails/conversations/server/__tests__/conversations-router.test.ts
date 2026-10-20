import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the permission procedure for a plain one so the per-account
// scoping can be exercised against the test database without a session.
vi.mock("@/trpc/init", async () => {
  const { initTRPC } = await import("@trpc/server");
  const superjson = (await import("superjson")).default;
  const t = initTRPC.create({ transformer: superjson });

  return {
    createTRPCRouter: t.router,
    createCallerFactory: t.createCallerFactory,
    baseProcedure: t.procedure,
    protectedProcedure: t.procedure,
    permissionProcedure: () => t.procedure,
  };
});

// The send use-case is exercised against the real database in
// `send-one-to-one.test.ts`; here we only verify the procedure's permission
// scoping and error mapping, so the provider call is replaced with a spy.
const { sendConversationMessageMock, sendNewMessageMock } = vi.hoisted(() => ({
  sendConversationMessageMock: vi.fn(),
  sendNewMessageMock: vi.fn(),
}));

vi.mock("@/modules/mails/conversations/lib/send-one-to-one", () => {
  class ConversationSendError extends Error {
    constructor(
      message: string,
      public readonly code: string,
    ) {
      super(message);
    }
  }

  return {
    ConversationSendError,
    sendConversationMessage: sendConversationMessageMock,
  };
});

vi.mock("@/modules/mails/conversations/lib/send-new-message", () => {
  class NewMessageError extends Error {
    constructor(
      message: string,
      public readonly code: string,
    ) {
      super(message);
    }
  }

  return { NewMessageError, sendNewMessage: sendNewMessageMock };
});

// Permanent deletion removes stored attachment files through the storage
// adapter. The network call is replaced so the router test can assert the
// cleanup without reaching UploadThing.
const { attachmentStorageMock } = vi.hoisted(() => ({
  attachmentStorageMock: {
    store: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/modules/mails/conversations/lib/attachment-storage", () => ({
  createUploadThingStorage: () => attachmentStorageMock,
}));

import { createCallerFactory } from "@/trpc/init";

import { db } from "@/shared/lib/db";
import { ConversationSendError } from "@/modules/mails/conversations/lib/send-one-to-one";
import { NewMessageError } from "@/modules/mails/conversations/lib/send-new-message";

import { conversationsRouter } from "../procedures";

const createCaller = createCallerFactory(conversationsRouter);

const accountIds: string[] = [];
const userIds: string[] = [];
const contactIds: string[] = [];

let caller: ReturnType<typeof createCaller>;
let userId: string;

async function createUser() {
  const user = await db.user.create({
    data: { email: `user-${randomUUID()}@example.com` },
  });
  userIds.push(user.id);
  return user;
}

async function createAccount(userIds: string[] = []) {
  const account = await db.emailAccount.create({
    data: {
      name: `Account ${randomUUID()}`,
      email: `inbox-${randomUUID()}@example.com`,
      userPermissions: {
        create: userIds.map((id) => ({ userId: id })),
      },
    },
  });
  accountIds.push(account.id);
  return account;
}

async function createConversation(
  emailAccountId: string,
  overrides: Partial<{
    contactEmail: string;
    contactName: string | null;
    lastMessageAt: Date | null;
    lastInboundAt: Date | null;
    deletedAt: Date | null;
    archivedAt: Date | null;
  }> = {},
) {
  return db.conversation.create({
    data: {
      emailAccountId,
      contactEmail: overrides.contactEmail ?? `contact-${randomUUID()}@example.com`,
      contactName: overrides.contactName ?? null,
      lastMessageAt: overrides.lastMessageAt ?? null,
      lastInboundAt: overrides.lastInboundAt ?? null,
      deletedAt: overrides.deletedAt ?? null,
      archivedAt: overrides.archivedAt ?? null,
    },
  });
}

async function createMessage(
  conversationId: string,
  overrides: Partial<{
    direction: "INBOUND" | "OUTBOUND";
    subject: string | null;
    bodyText: string | null;
    bodyHtml: string | null;
    fromAddress: string;
    toAddresses: string[];
    sentAt: Date;
    createdAt: Date;
  }> = {},
  attachments: { filename: string; contentType: string; url: string }[] = [],
) {
  const direction = overrides.direction ?? "INBOUND";
  const sentAt = overrides.sentAt ?? new Date();
  const message = await db.emailMessage.create({
    data: {
      conversationId,
      direction,
      status: direction === "OUTBOUND" ? "SENT" : "RECEIVED",
      subject: overrides.subject ?? "Subject",
      bodyText: overrides.bodyText === undefined ? "Body" : overrides.bodyText,
      bodyHtml: overrides.bodyHtml ?? null,
      fromAddress: overrides.fromAddress ?? "contact@example.com",
      toAddresses: overrides.toAddresses ?? ["support@example.com"],
      ccAddresses: [],
      bccAddresses: [],
      sentAt,
      createdAt: overrides.createdAt ?? sentAt,
      attachments: attachments.length
        ? { create: attachments }
        : undefined,
    },
  });

  await db.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: sentAt,
      ...(direction === "INBOUND" ? { lastInboundAt: sentAt } : {}),
    },
  });

  return message;
}

beforeEach(async () => {
  accountIds.length = 0;
  userIds.length = 0;
  contactIds.length = 0;
  sendConversationMessageMock.mockReset();
  sendNewMessageMock.mockReset();
  attachmentStorageMock.store.mockReset();
  attachmentStorageMock.delete.mockReset();
  attachmentStorageMock.delete.mockResolvedValue(undefined);

  const user = await createUser();
  userId = user.id;
  caller = createCaller({ userId: user.id, auth: { id: user.id } });
});

afterEach(async () => {
  if (accountIds.length > 0) {
    await db.emailAccount.deleteMany({ where: { id: { in: accountIds } } });
  }
  if (contactIds.length > 0) {
    await db.emailContact.deleteMany({ where: { id: { in: contactIds } } });
  }
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  accountIds.length = 0;
  userIds.length = 0;
  contactIds.length = 0;
});

describe("conversationsRouter", () => {
  describe("getMany", () => {
    it("lists the account's conversations, newest activity first", async () => {
      const account = await createAccount([userId]);
      const older = await createConversation(account.id, {
        contactEmail: "older@example.com",
        contactName: "Older Contact",
      });
      await createMessage(older.id, {
        bodyText: "Older body",
        sentAt: new Date("2026-10-17T11:00:00.000Z"),
      });
      const newer = await createConversation(account.id, {
        contactEmail: "newer@example.com",
      });
      await createMessage(newer.id, {
        bodyText: "Newer body",
        sentAt: new Date("2026-10-17T10:00:00.000Z"),
      });

      const result = await caller.getMany({ emailAccountId: account.id });

      expect(result.map((c) => c.id)).toEqual([older.id, newer.id]);
      expect(result[0]!.isUnread).toBe(true);
      expect(result[0]!.contactName).toBe("Older Contact");
      expect(result[0]!.messageCount).toBe(1);
      expect(result[0]!.lastMessage?.snippet).toBe("Older body");
      expect(result[0]!.lastMessage?.direction).toBe("INBOUND");
    });

    it("derives unread per user, not per conversation", async () => {
      const otherUser = await createUser();
      const account = await createAccount([userId, otherUser.id]);
      const conversation = await createConversation(account.id);
      const message = await createMessage(conversation.id, {
        sentAt: new Date("2026-10-17T10:00:00.000Z"),
      });

      await db.conversationUserState.create({
        data: {
          userId: otherUser.id,
          conversationId: conversation.id,
          lastReadAt: new Date(message.sentAt!.getTime() + 1_000),
        },
      });

      const mine = await caller.getMany({ emailAccountId: account.id });
      const theirs = await createCaller({
        userId: otherUser.id,
        auth: { id: otherUser.id },
      }).getMany({ emailAccountId: account.id });

      expect(mine[0]!.isUnread).toBe(true);
      expect(theirs[0]!.isUnread).toBe(false);
    });

    it("excludes soft-deleted conversations", async () => {
      const account = await createAccount([userId]);
      const visible = await createConversation(account.id);
      await createConversation(account.id, { deletedAt: new Date() });

      const result = await caller.getMany({ emailAccountId: account.id });

      expect(result.map((c) => c.id)).toEqual([visible.id]);
    });

    it("hides archived conversations unless the archived view is requested", async () => {
      const account = await createAccount([userId]);
      const active = await createConversation(account.id);
      const archived = await createConversation(account.id, {
        archivedAt: new Date(),
      });

      const inbox = await caller.getMany({ emailAccountId: account.id });
      const archive = await caller.getMany({
        emailAccountId: account.id,
        view: "archived",
      });

      expect(inbox.map((c) => c.id)).toEqual([active.id]);
      expect(archive.map((c) => c.id)).toEqual([archived.id]);
    });

    it("lists only trashed conversations, most recently deleted first", async () => {
      const account = await createAccount([userId]);
      await createConversation(account.id);
      const deletedEarlier = await createConversation(account.id, {
        deletedAt: new Date("2026-10-17T10:00:00.000Z"),
        lastMessageAt: new Date("2026-10-17T12:00:00.000Z"),
      });
      const deletedLater = await createConversation(account.id, {
        deletedAt: new Date("2026-10-17T11:00:00.000Z"),
        lastMessageAt: new Date("2026-10-17T09:00:00.000Z"),
      });

      const trash = await caller.getMany({
        emailAccountId: account.id,
        view: "trash",
      });
      const inbox = await caller.getMany({ emailAccountId: account.id });

      expect(trash.map((conversation) => conversation.id)).toEqual([
        deletedLater.id,
        deletedEarlier.id,
      ]);
      expect(inbox.map((conversation) => conversation.id)).not.toContain(
        deletedEarlier.id,
      );
    });

    it("excludes trashed conversations from Starred and Archive", async () => {
      const account = await createAccount([userId]);
      const starredThenTrashed = await createConversation(account.id);
      await caller.setStarred({ id: starredThenTrashed.id, starred: true });
      const archivedThenTrashed = await createConversation(account.id, {
        archivedAt: new Date("2026-10-17T10:00:00.000Z"),
      });
      const deletedAt = new Date("2026-10-17T11:00:00.000Z");
      await db.conversation.updateMany({
        where: {
          id: { in: [starredThenTrashed.id, archivedThenTrashed.id] },
        },
        data: { deletedAt },
      });

      const starred = await caller.getMany({
        emailAccountId: account.id,
        view: "starred",
      });
      const archived = await caller.getMany({
        emailAccountId: account.id,
        view: "archived",
      });

      expect(starred).toHaveLength(0);
      expect(archived).toHaveLength(0);
    });

    it("flags the last message when it carries attachments", async () => {
      const account = await createAccount([userId]);
      const withFile = await createConversation(account.id);
      await createMessage(
        withFile.id,
        { bodyHtml: "<p>See attached</p>", bodyText: null },
        [
          {
            filename: "invoice.pdf",
            contentType: "application/pdf",
            url: "https://files/invoice.pdf",
          },
        ],
      );
      const plain = await createConversation(account.id);
      await createMessage(plain.id, { bodyText: "Nothing attached" });

      const result = await caller.getMany({ emailAccountId: account.id });
      const listItem = result.find((c) => c.id === withFile.id);

      expect(listItem?.lastMessage?.hasAttachments).toBe(true);
      expect(listItem?.lastMessage?.snippet).toBe("See attached");
    });

    it("excludes conversations from other accounts", async () => {
      const account = await createAccount([userId]);
      const other = await createAccount([userId]);
      const mine = await createConversation(account.id);
      await createConversation(other.id);

      const result = await caller.getMany({ emailAccountId: account.id });

      expect(result.map((c) => c.id)).toEqual([mine.id]);
    });

    it("rejects an account the user is not assigned to", async () => {
      const account = await createAccount();
      await createConversation(account.id);

      await expect(
        caller.getMany({ emailAccountId: account.id }),
      ).rejects.toThrow();
    });
  });

  describe("starring", () => {
    it("stars a conversation for the caller only, creating a state row", async () => {
      const otherUser = await createUser();
      const account = await createAccount([userId, otherUser.id]);
      const conversation = await createConversation(account.id);

      const result = await caller.setStarred({
        id: conversation.id,
        starred: true,
      });

      expect(result.starredAt).toBeInstanceOf(Date);

      const state = await db.conversationUserState.findUniqueOrThrow({
        where: {
          userId_conversationId: {
            userId,
            conversationId: conversation.id,
          },
        },
      });
      expect(state.starredAt).toBeInstanceOf(Date);

      const mine = await caller.getMany({
        emailAccountId: account.id,
        view: "starred",
      });
      expect(mine.map((row) => row.id)).toEqual([conversation.id]);
      expect(mine[0]!.isStarred).toBe(true);
      expect((await caller.getOne({ id: conversation.id })).isStarred).toBe(
        true,
      );

      const theirCaller = createCaller({
        userId: otherUser.id,
        auth: { id: otherUser.id },
      });
      expect(
        await theirCaller.getMany({
          emailAccountId: account.id,
          view: "starred",
        }),
      ).toHaveLength(0);
      const theirInbox = await theirCaller.getMany({
        emailAccountId: account.id,
      });
      expect(theirInbox[0]!.isStarred).toBe(false);
    });

    it("removes an unstarred conversation from the Starred view", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);

      await caller.setStarred({ id: conversation.id, starred: true });
      await caller.setStarred({ id: conversation.id, starred: false });

      const starred = await caller.getMany({
        emailAccountId: account.id,
        view: "starred",
      });
      expect(starred).toHaveLength(0);

      const inbox = await caller.getMany({ emailAccountId: account.id });
      expect(inbox[0]!.isStarred).toBe(false);

      const state = await db.conversationUserState.findUniqueOrThrow({
        where: {
          userId_conversationId: {
            userId,
            conversationId: conversation.id,
          },
        },
      });
      expect(state.starredAt).toBeNull();
    });

    it("keeps a starred archived conversation in the Starred view", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id, {
        archivedAt: new Date("2026-10-17T10:00:00.000Z"),
      });

      await caller.setStarred({ id: conversation.id, starred: true });

      const starred = await caller.getMany({
        emailAccountId: account.id,
        view: "starred",
      });
      expect(starred.map((conversation) => conversation.id)).toEqual([
        conversation.id,
      ]);

      const archived = await caller.getMany({
        emailAccountId: account.id,
        view: "archived",
      });
      expect(archived.map((conversation) => conversation.id)).toEqual([
        conversation.id,
      ]);
    });

    it("orders the Starred view by newest activity", async () => {
      const account = await createAccount([userId]);
      const older = await createConversation(account.id, {
        lastMessageAt: new Date("2026-10-17T10:00:00.000Z"),
      });
      const newer = await createConversation(account.id, {
        lastMessageAt: new Date("2026-10-17T11:00:00.000Z"),
      });

      await caller.setStarred({ id: older.id, starred: true });
      await caller.setStarred({ id: newer.id, starred: true });

      const result = await caller.getMany({
        emailAccountId: account.id,
        view: "starred",
      });

      expect(result.map((conversation) => conversation.id)).toEqual([
        newer.id,
        older.id,
      ]);
    });

    it("does not change the conversation activity timestamps", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);
      await createMessage(conversation.id, {
        sentAt: new Date("2026-10-17T10:00:00.000Z"),
      });

      const before = await db.conversation.findUniqueOrThrow({
        where: { id: conversation.id },
      });

      await caller.setStarred({ id: conversation.id, starred: true });

      const after = await db.conversation.findUniqueOrThrow({
        where: { id: conversation.id },
      });

      expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
      expect(after.lastMessageAt?.getTime()).toBe(
        before.lastMessageAt?.getTime(),
      );
    });

    it("rejects a conversation on an account the user is not assigned to", async () => {
      const account = await createAccount();
      const conversation = await createConversation(account.id);

      await expect(
        caller.setStarred({ id: conversation.id, starred: true }),
      ).rejects.toThrow();

      expect(
        await db.conversationUserState.count({
          where: { conversationId: conversation.id },
        }),
      ).toBe(0);
    });
  });

  describe("getSentMessages", () => {
    it("returns outbound messages newest first, with recipients and attachment hints", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);
      await createMessage(conversation.id, {
        direction: "INBOUND",
        subject: "Inbound message",
        sentAt: new Date("2026-10-17T12:00:00.000Z"),
      });
      const older = await createMessage(conversation.id, {
        direction: "OUTBOUND",
        subject: "Older outbound",
        bodyText: "Older body",
        toAddresses: ["first@example.com"],
        // A delayed send: creation order, not `sentAt`, must decide the list.
        sentAt: new Date("2026-10-17T12:30:00.000Z"),
        createdAt: new Date("2026-10-17T10:00:00.000Z"),
      });
      const newer = await createMessage(
        conversation.id,
        {
          direction: "OUTBOUND",
          subject: "Newer outbound",
          bodyText: "Newer body",
          toAddresses: ["second@example.com"],
          sentAt: new Date("2026-10-17T11:00:00.000Z"),
          createdAt: new Date("2026-10-17T11:00:00.000Z"),
        },
        [
          {
            filename: "quote.pdf",
            contentType: "application/pdf",
            url: "https://files/quote.pdf",
          },
        ],
      );

      const result = await caller.getSentMessages({
        emailAccountId: account.id,
      });

      expect(result.map((message) => message.id)).toEqual([newer.id, older.id]);
      expect(result[0]).toMatchObject({
        conversationId: conversation.id,
        subject: "Newer outbound",
        recipients: ["second@example.com"],
        snippet: "Newer body",
      });
      expect(result[0]!.attachments).toHaveLength(1);
      expect(result[1]!.attachments).toHaveLength(0);
    });

    it("excludes outbound messages in trashed conversations", async () => {
      const account = await createAccount([userId]);
      const active = await createConversation(account.id);
      const trashed = await createConversation(account.id, {
        deletedAt: new Date("2026-10-17T10:00:00.000Z"),
      });
      const visible = await createMessage(active.id, {
        direction: "OUTBOUND",
        subject: "Visible",
        sentAt: new Date("2026-10-17T10:00:00.000Z"),
      });
      await createMessage(trashed.id, {
        direction: "OUTBOUND",
        subject: "Trashed",
        sentAt: new Date("2026-10-17T11:00:00.000Z"),
      });

      const result = await caller.getSentMessages({
        emailAccountId: account.id,
      });

      expect(result.map((message) => message.id)).toEqual([visible.id]);
    });

    it("excludes outbound messages from other accounts", async () => {
      const account = await createAccount([userId]);
      const other = await createAccount([userId]);
      const mine = await createConversation(account.id);
      const theirs = await createConversation(other.id);
      const visible = await createMessage(mine.id, {
        direction: "OUTBOUND",
        sentAt: new Date("2026-10-17T10:00:00.000Z"),
      });
      await createMessage(theirs.id, {
        direction: "OUTBOUND",
        sentAt: new Date("2026-10-17T11:00:00.000Z"),
      });

      const result = await caller.getSentMessages({
        emailAccountId: account.id,
      });

      expect(result.map((message) => message.id)).toEqual([visible.id]);
    });

    it("rejects an account the user is not assigned to", async () => {
      const account = await createAccount();
      const conversation = await createConversation(account.id);
      await createMessage(conversation.id, { direction: "OUTBOUND" });

      await expect(
        caller.getSentMessages({ emailAccountId: account.id }),
      ).rejects.toThrow();
    });
  });

  describe("getCounts", () => {
    it("counts unread and archived conversations per accessible account", async () => {
      const account = await createAccount([userId]);
      const emptyAccount = await createAccount([userId]);
      const inaccessible = await createAccount();

      const unread = await createConversation(account.id);
      await createMessage(unread.id, {
        sentAt: new Date("2026-10-17T10:00:00.000Z"),
      });

      const archived = await createConversation(account.id, {
        archivedAt: new Date("2026-10-17T10:05:00.000Z"),
      });
      await createMessage(archived.id, {
        sentAt: new Date("2026-10-17T10:05:00.000Z"),
      });

      const deleted = await createConversation(account.id, {
        deletedAt: new Date("2026-10-17T10:10:00.000Z"),
      });
      await createMessage(deleted.id, {
        sentAt: new Date("2026-10-17T10:10:00.000Z"),
      });

      const read = await createConversation(account.id);
      const readMessage = await createMessage(read.id, {
        sentAt: new Date("2026-10-17T10:15:00.000Z"),
      });
      await db.conversationUserState.create({
        data: {
          userId,
          conversationId: read.id,
          lastReadAt: new Date(readMessage.sentAt!.getTime() + 1_000),
        },
      });

      const hidden = await createConversation(inaccessible.id);
      await createMessage(hidden.id);

      const result = await caller.getCounts();

      expect(result.totalUnread).toBe(1);
      expect(result.accounts).toHaveLength(2);
      expect(result.accounts).toEqual(
        expect.arrayContaining([
          { emailAccountId: account.id, unread: 1, archived: 1 },
          { emailAccountId: emptyAccount.id, unread: 0, archived: 0 },
        ]),
      );
      expect(
        result.accounts.some(
          (entry) => entry.emailAccountId === inaccessible.id,
        ),
      ).toBe(false);
    });

    it("keeps read state personal to each user", async () => {
      const otherUser = await createUser();
      const account = await createAccount([userId, otherUser.id]);
      const conversation = await createConversation(account.id);
      const message = await createMessage(conversation.id, {
        sentAt: new Date("2026-10-17T10:00:00.000Z"),
      });

      await db.conversationUserState.create({
        data: {
          userId: otherUser.id,
          conversationId: conversation.id,
          lastReadAt: new Date(message.sentAt!.getTime() + 1_000),
        },
      });

      const mine = await caller.getCounts();
      const theirs = await createCaller({
        userId: otherUser.id,
        auth: { id: otherUser.id },
      }).getCounts();

      expect(mine.totalUnread).toBe(1);
      expect(theirs.totalUnread).toBe(0);
    });

    it("returns zero for a user without account permissions", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);
      await createMessage(conversation.id);

      const outsider = await createUser();
      const result = await createCaller({
        userId: outsider.id,
        auth: { id: outsider.id },
      }).getCounts();

      expect(result).toEqual({ totalUnread: 0, accounts: [] });
    });
  });

  describe("getOne", () => {
    it("returns the full thread with attachments in chronological order", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);
      await createMessage(conversation.id, { bodyText: "First" });
      await createMessage(
        conversation.id,
        { bodyText: "Second", direction: "OUTBOUND" },
        [{ filename: "report.pdf", contentType: "application/pdf", url: "https://files/report.pdf" }],
      );

      const result = await caller.getOne({ id: conversation.id });

      expect(result.messages.map((m) => m.bodyText)).toEqual([
        "First",
        "Second",
      ]);
      expect(result.messages[1]!.direction).toBe("OUTBOUND");
      expect(result.messages[1]!.attachments).toHaveLength(1);
      expect(result.messages[1]!.attachments[0]!.filename).toBe("report.pdf");
    });

    it("throws NOT_FOUND for an unknown conversation", async () => {
      await expect(caller.getOne({ id: randomUUID() })).rejects.toThrow();
    });

    it("throws NOT_FOUND for a soft-deleted conversation", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id, {
        deletedAt: new Date(),
      });

      await expect(caller.getOne({ id: conversation.id })).rejects.toThrow();
    });

    it("rejects a conversation on an account the user is not assigned to", async () => {
      const account = await createAccount();
      const conversation = await createConversation(account.id);

      await expect(caller.getOne({ id: conversation.id })).rejects.toThrow();
    });
  });

  describe("read state", () => {
    it("walks never read, read, new inbound and unread transitions", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);
      await createMessage(conversation.id, {
        sentAt: new Date("2026-10-17T10:00:00.000Z"),
      });

      expect((await caller.getOne({ id: conversation.id })).isUnread).toBe(true);

      await caller.markRead({ id: conversation.id });

      const afterRead = await db.conversationUserState.findUniqueOrThrow({
        where: {
          userId_conversationId: {
            userId,
            conversationId: conversation.id,
          },
        },
      });
      expect(afterRead.lastReadAt).toBeInstanceOf(Date);
      expect((await caller.getOne({ id: conversation.id })).isUnread).toBe(
        false,
      );

      await createMessage(conversation.id, {
        sentAt: new Date(afterRead.lastReadAt!.getTime() + 1),
      });
      expect((await caller.getOne({ id: conversation.id })).isUnread).toBe(true);

      await caller.markUnread({ id: conversation.id });

      const afterUnread = await db.conversationUserState.findUniqueOrThrow({
        where: {
          userId_conversationId: {
            userId,
            conversationId: conversation.id,
          },
        },
      });
      expect(afterUnread.lastReadAt).toBeNull();
      expect((await caller.getOne({ id: conversation.id })).isUnread).toBe(true);

      await caller.markRead({ id: conversation.id });
      expect((await caller.getOne({ id: conversation.id })).isUnread).toBe(
        false,
      );
    });

    it("keeps the read watermark personal", async () => {
      const otherUser = await createUser();
      const account = await createAccount([userId, otherUser.id]);
      const conversation = await createConversation(account.id);
      await createMessage(conversation.id);

      await caller.markRead({ id: conversation.id });

      const theirs = createCaller({
        userId: otherUser.id,
        auth: { id: otherUser.id },
      });
      expect((await theirs.getOne({ id: conversation.id })).isUnread).toBe(true);

      await theirs.markUnread({ id: conversation.id });
      expect((await caller.getOne({ id: conversation.id })).isUnread).toBe(
        false,
      );
    });

    it("creates a state row when marking unread without one", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);
      await createMessage(conversation.id);

      await caller.markUnread({ id: conversation.id });

      const state = await db.conversationUserState.findUnique({
        where: {
          userId_conversationId: {
            userId,
            conversationId: conversation.id,
          },
        },
      });
      expect(state?.lastReadAt).toBeNull();
    });

    it("rejects a conversation on an account the user is not assigned to", async () => {
      const account = await createAccount();
      const conversation = await createConversation(account.id);

      await expect(caller.markRead({ id: conversation.id })).rejects.toThrow();
      await expect(
        caller.markUnread({ id: conversation.id }),
      ).rejects.toThrow();

      expect(
        await db.conversationUserState.count({
          where: { conversationId: conversation.id },
        }),
      ).toBe(0);
    });

    it("marks the thread read when replying", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);
      sendConversationMessageMock.mockResolvedValue({
        conversationId: conversation.id,
        messageId: "message-1",
        providerId: "provider-1",
      });

      await caller.sendReply({
        conversationId: conversation.id,
        bodyHtml: "<p>Thanks</p>",
      });

      const state = await db.conversationUserState.findUniqueOrThrow({
        where: {
          userId_conversationId: {
            userId,
            conversationId: conversation.id,
          },
        },
      });
      expect(state.lastReadAt).toBeInstanceOf(Date);
    });
  });

  describe("sendReply", () => {
    it("sends through the use-case for an accessible conversation", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);

      sendConversationMessageMock.mockResolvedValue({
        conversationId: conversation.id,
        messageId: "message-1",
        providerId: "provider-1",
      });

      const result = await caller.sendReply({
        conversationId: conversation.id,
        bodyHtml: "<p>Thanks</p>",
        bodyText: "Thanks",
        attachments: [
          {
            filename: "quote.pdf",
            contentType: "application/pdf",
            url: "https://files.test/quote.pdf",
          },
        ],
      });

      expect(result).toEqual({
        conversationId: conversation.id,
        messageId: "message-1",
        providerId: "provider-1",
      });
      expect(sendConversationMessageMock).toHaveBeenCalledWith({
        conversationId: conversation.id,
        subject: undefined,
        bodyHtml: "<p>Thanks</p>",
        bodyText: "Thanks",
        attachments: [
          {
            filename: "quote.pdf",
            contentType: "application/pdf",
            url: "https://files.test/quote.pdf",
          },
        ],
      });
    });

    it("rejects an account the user is not assigned to without sending", async () => {
      const account = await createAccount();
      const conversation = await createConversation(account.id);

      await expect(
        caller.sendReply({
          conversationId: conversation.id,
          bodyHtml: "<p>Thanks</p>",
        }),
      ).rejects.toThrow();

      expect(sendConversationMessageMock).not.toHaveBeenCalled();
    });

    it("rejects an unknown conversation", async () => {
      await expect(
        caller.sendReply({
          conversationId: randomUUID(),
          bodyHtml: "<p>Thanks</p>",
        }),
      ).rejects.toThrow();

      expect(sendConversationMessageMock).not.toHaveBeenCalled();
    });

    it("requires a message body", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);

      await expect(
        caller.sendReply({
          conversationId: conversation.id,
          bodyHtml: "   ",
        }),
      ).rejects.toThrow();

      expect(sendConversationMessageMock).not.toHaveBeenCalled();
    });

    it("maps a quota failure to TOO_MANY_REQUESTS", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);

      sendConversationMessageMock.mockRejectedValue(
        new ConversationSendError("quota reached", "QUOTA_EXCEEDED"),
      );

      await expect(
        caller.sendReply({
          conversationId: conversation.id,
          bodyHtml: "<p>Thanks</p>",
        }),
      ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    });
  });

  describe("sendNew", () => {
    it("sends through the use-case for an accessible account", async () => {
      const account = await createAccount([userId]);

      sendNewMessageMock.mockResolvedValue({
        conversationId: "conversation-1",
        messageId: "message-1",
        providerId: "provider-1",
      });

      const result = await caller.sendNew({
        emailAccountId: account.id,
        to: "newcomer@example.com",
        subject: "Hello",
        bodyHtml: "<p>Hello</p>",
        bodyText: "Hello",
      });

      expect(result).toEqual({
        conversationId: "conversation-1",
        messageId: "message-1",
        providerId: "provider-1",
      });
      expect(sendNewMessageMock).toHaveBeenCalledWith({
        emailAccountId: account.id,
        to: "newcomer@example.com",
        subject: "Hello",
        bodyHtml: "<p>Hello</p>",
        bodyText: "Hello",
        attachments: undefined,
      });
    });

    it("rejects an account the user is not assigned to without sending", async () => {
      const account = await createAccount();

      await expect(
        caller.sendNew({
          emailAccountId: account.id,
          to: "newcomer@example.com",
          subject: "Hello",
          bodyHtml: "<p>Hello</p>",
        }),
      ).rejects.toThrow();

      expect(sendNewMessageMock).not.toHaveBeenCalled();
    });

    it("requires a valid recipient address", async () => {
      const account = await createAccount([userId]);

      await expect(
        caller.sendNew({
          emailAccountId: account.id,
          to: "not-an-email",
          subject: "Hello",
          bodyHtml: "<p>Hello</p>",
        }),
      ).rejects.toThrow();

      expect(sendNewMessageMock).not.toHaveBeenCalled();
    });

    it("maps a quota failure to TOO_MANY_REQUESTS", async () => {
      const account = await createAccount([userId]);

      sendNewMessageMock.mockRejectedValue(
        new NewMessageError("quota reached", "QUOTA_EXCEEDED"),
      );

      await expect(
        caller.sendNew({
          emailAccountId: account.id,
          to: "newcomer@example.com",
          subject: "Hello",
          bodyHtml: "<p>Hello</p>",
        }),
      ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    });
  });

  describe("setArchived", () => {
    it("archives and unarchives a conversation", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);

      const archived = await caller.setArchived({
        id: conversation.id,
        archived: true,
      });
      expect(archived.archivedAt).not.toBeNull();

      await caller.getMany({ emailAccountId: account.id }).then((result) => {
        expect(result.map((c) => c.id)).not.toContain(conversation.id);
      });

      const unarchived = await caller.setArchived({
        id: conversation.id,
        archived: false,
      });
      expect(unarchived.archivedAt).toBeNull();
    });

    it("rejects a conversation on an account the user is not assigned to", async () => {
      const account = await createAccount();
      const conversation = await createConversation(account.id);

      await expect(
        caller.setArchived({ id: conversation.id, archived: true }),
      ).rejects.toThrow();
    });
  });

  describe("remove", () => {
    it("soft-deletes a conversation", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);

      await caller.remove({ id: conversation.id });

      const stored = await db.conversation.findUniqueOrThrow({
        where: { id: conversation.id },
      });
      expect(stored.deletedAt).not.toBeNull();

      await expect(caller.getOne({ id: conversation.id })).rejects.toThrow();
      const inbox = await caller.getMany({ emailAccountId: account.id });
      expect(inbox).toHaveLength(0);
    });

    it("rejects an unknown conversation", async () => {
      await expect(caller.remove({ id: randomUUID() })).rejects.toThrow();
    });

    it("rejects a conversation on an account the user is not assigned to", async () => {
      const account = await createAccount();
      const conversation = await createConversation(account.id);

      await expect(caller.remove({ id: conversation.id })).rejects.toThrow();
    });
  });

  describe("restore", () => {
    it("returns a trashed conversation to the inbox", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id, {
        deletedAt: new Date("2026-10-17T11:00:00.000Z"),
      });

      await caller.restore({ id: conversation.id });

      const stored = await db.conversation.findUniqueOrThrow({
        where: { id: conversation.id },
      });
      expect(stored.deletedAt).toBeNull();

      const inbox = await caller.getMany({ emailAccountId: account.id });
      expect(inbox.map((row) => row.id)).toEqual([conversation.id]);

      const trash = await caller.getMany({
        emailAccountId: account.id,
        view: "trash",
      });
      expect(trash).toHaveLength(0);
    });

    it("returns an archived conversation to the Archive", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id, {
        deletedAt: new Date("2026-10-17T11:00:00.000Z"),
        archivedAt: new Date("2026-10-17T09:00:00.000Z"),
      });

      await caller.restore({ id: conversation.id });

      const archive = await caller.getMany({
        emailAccountId: account.id,
        view: "archived",
      });
      const inbox = await caller.getMany({ emailAccountId: account.id });

      expect(archive.map((row) => row.id)).toEqual([conversation.id]);
      expect(inbox).toHaveLength(0);
    });

    it("rejects an active conversation as missing", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);

      await expect(
        caller.restore({ id: conversation.id }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects a conversation on an account the user is not assigned to", async () => {
      const account = await createAccount();
      const conversation = await createConversation(account.id, {
        deletedAt: new Date("2026-10-17T11:00:00.000Z"),
      });

      await expect(
        caller.restore({ id: conversation.id }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      const stored = await db.conversation.findUniqueOrThrow({
        where: { id: conversation.id },
      });
      expect(stored.deletedAt).not.toBeNull();
    });
  });

  describe("deleteForever", () => {
    it("hard-deletes the conversation with its messages and attachments", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id, {
        deletedAt: new Date("2026-10-17T11:00:00.000Z"),
      });
      await createMessage(conversation.id, {}, [
        {
          filename: "invoice.pdf",
          contentType: "application/pdf",
          url: "https://files/invoice.pdf",
        },
      ]);

      const result = await caller.deleteForever({ id: conversation.id });

      expect(result).toEqual({ id: conversation.id });
      expect(
        await db.conversation.findUnique({ where: { id: conversation.id } }),
      ).toBeNull();
      expect(
        await db.emailMessage.count({
          where: { conversationId: conversation.id },
        }),
      ).toBe(0);
      expect(
        await db.emailAttachment.count({
          where: { emailMessage: { conversationId: conversation.id } },
        }),
      ).toBe(0);
    });

    it("attempts to remove stored attachment files", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id, {
        deletedAt: new Date("2026-10-17T11:00:00.000Z"),
      });
      await createMessage(conversation.id, {}, [
        {
          filename: "one.pdf",
          contentType: "application/pdf",
          url: "https://files/one.pdf",
        },
        {
          filename: "two.pdf",
          contentType: "application/pdf",
          url: "https://files/two.pdf",
        },
      ]);

      await caller.deleteForever({ id: conversation.id });

      expect(attachmentStorageMock.delete).toHaveBeenCalledWith([
        "https://files/one.pdf",
        "https://files/two.pdf",
      ]);
    });

    it("deletes the rows even when storage cleanup fails", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id, {
        deletedAt: new Date("2026-10-17T11:00:00.000Z"),
      });
      await createMessage(conversation.id, {}, [
        {
          filename: "stuck.pdf",
          contentType: "application/pdf",
          url: "https://files/stuck.pdf",
        },
      ]);
      attachmentStorageMock.delete.mockRejectedValue(
        new Error("storage unavailable"),
      );
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      await expect(
        caller.deleteForever({ id: conversation.id }),
      ).resolves.toEqual({ id: conversation.id });

      expect(
        await db.conversation.findUnique({ where: { id: conversation.id } }),
      ).toBeNull();
      consoleError.mockRestore();
    });

    it("rejects an active conversation without deleting it", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id);

      await expect(
        caller.deleteForever({ id: conversation.id }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      expect(
        await db.conversation.findUnique({ where: { id: conversation.id } }),
      ).not.toBeNull();
      expect(attachmentStorageMock.delete).not.toHaveBeenCalled();
    });

    it("rejects a conversation on an account the user is not assigned to", async () => {
      const account = await createAccount();
      const conversation = await createConversation(account.id, {
        deletedAt: new Date("2026-10-17T11:00:00.000Z"),
      });

      await expect(
        caller.deleteForever({ id: conversation.id }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      expect(
        await db.conversation.findUnique({ where: { id: conversation.id } }),
      ).not.toBeNull();
      expect(attachmentStorageMock.delete).not.toHaveBeenCalled();
    });
  });

  describe("createContact", () => {
    it("creates a contact from the conversation sender and links it", async () => {
      const account = await createAccount([userId]);
      const conversation = await createConversation(account.id, {
        contactEmail: `jessica-${randomUUID()}@example.com`,
        contactName: "Jessica Ball",
      });

      const contact = await caller.createContact({ id: conversation.id });
      contactIds.push(contact.id);

      expect(contact).toMatchObject({
        email: conversation.contactEmail,
        firstName: "Jessica",
        lastName: "Ball",
        isSubscriber: false,
      });

      const stored = await db.conversation.findUniqueOrThrow({
        where: { id: conversation.id },
      });
      expect(stored.contactId).toBe(contact.id);
    });

    it("reuses an existing contact instead of duplicating it", async () => {
      const account = await createAccount([userId]);
      const email = `existing-${randomUUID()}@example.com`;
      const existing = await db.emailContact.create({
        data: { email, firstName: "Existing" },
      });
      contactIds.push(existing.id);
      const conversation = await createConversation(account.id, {
        contactEmail: email,
      });

      const contact = await caller.createContact({ id: conversation.id });

      expect(contact.id).toBe(existing.id);
      expect(
        await db.emailContact.count({ where: { email } }),
      ).toBe(1);
    });

    it("returns the linked contact when the conversation is already linked", async () => {
      const account = await createAccount([userId]);
      const existing = await db.emailContact.create({
        data: { email: `linked-${randomUUID()}@example.com` },
      });
      contactIds.push(existing.id);
      const conversation = await createConversation(account.id);
      await db.conversation.update({
        where: { id: conversation.id },
        data: { contactId: existing.id },
      });

      const contact = await caller.createContact({ id: conversation.id });

      expect(contact.id).toBe(existing.id);
    });

    it("rejects a conversation on an account the user is not assigned to", async () => {
      const account = await createAccount();
      const conversation = await createConversation(account.id);

      await expect(
        caller.createContact({ id: conversation.id }),
      ).rejects.toThrow();
    });
  });
});
