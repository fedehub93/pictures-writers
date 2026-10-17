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
const { sendConversationMessageMock } = vi.hoisted(() => ({
  sendConversationMessageMock: vi.fn(),
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

import { createCallerFactory } from "@/trpc/init";

import { db } from "@/shared/lib/db";
import { ConversationSendError } from "@/modules/mails/conversations/lib/send-one-to-one";

import { conversationsRouter } from "../procedures";

const createCaller = createCallerFactory(conversationsRouter);

const accountIds: string[] = [];
const userIds: string[] = [];

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
    hasUnread: boolean;
    deletedAt: Date | null;
  }> = {},
) {
  return db.conversation.create({
    data: {
      emailAccountId,
      contactEmail: overrides.contactEmail ?? `contact-${randomUUID()}@example.com`,
      contactName: overrides.contactName ?? null,
      hasUnread: overrides.hasUnread ?? false,
      deletedAt: overrides.deletedAt ?? null,
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
  }> = {},
  attachments: { filename: string; contentType: string; url: string }[] = [],
) {
  return db.emailMessage.create({
    data: {
      conversationId,
      direction: overrides.direction ?? "INBOUND",
      status: overrides.direction === "OUTBOUND" ? "SENT" : "RECEIVED",
      subject: overrides.subject ?? "Subject",
      bodyText: overrides.bodyText === undefined ? "Body" : overrides.bodyText,
      bodyHtml: overrides.bodyHtml ?? null,
      fromAddress: overrides.fromAddress ?? "contact@example.com",
      toAddresses: overrides.toAddresses ?? ["support@example.com"],
      ccAddresses: [],
      bccAddresses: [],
      sentAt: new Date(),
      attachments: attachments.length
        ? { create: attachments }
        : undefined,
    },
  });
}

beforeEach(async () => {
  accountIds.length = 0;
  userIds.length = 0;
  sendConversationMessageMock.mockReset();

  const user = await createUser();
  userId = user.id;
  caller = createCaller({ userId: user.id, auth: { id: user.id } });
});

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

describe("conversationsRouter", () => {
  describe("getMany", () => {
    it("lists the account's conversations, newest activity first", async () => {
      const account = await createAccount([userId]);
      const older = await createConversation(account.id, {
        contactEmail: "older@example.com",
        contactName: "Older Contact",
      });
      await createMessage(older.id, { bodyText: "Older body" });
      const newer = await createConversation(account.id, {
        contactEmail: "newer@example.com",
      });
      await createMessage(newer.id, { bodyText: "Newer body" });

      // Bump the first conversation so it becomes the most recent activity.
      await db.conversation.update({
        where: { id: older.id },
        data: { hasUnread: true },
      });

      const result = await caller.getMany({ emailAccountId: account.id });

      expect(result.map((c) => c.id)).toEqual([older.id, newer.id]);
      expect(result[0]!.hasUnread).toBe(true);
      expect(result[0]!.contactName).toBe("Older Contact");
      expect(result[0]!.messageCount).toBe(1);
      expect(result[0]!.lastMessage?.snippet).toBe("Older body");
      expect(result[0]!.lastMessage?.direction).toBe("INBOUND");
    });

    it("excludes soft-deleted conversations", async () => {
      const account = await createAccount([userId]);
      const visible = await createConversation(account.id);
      await createConversation(account.id, { deletedAt: new Date() });

      const result = await caller.getMany({ emailAccountId: account.id });

      expect(result.map((c) => c.id)).toEqual([visible.id]);
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
});
