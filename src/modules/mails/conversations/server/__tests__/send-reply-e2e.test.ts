import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Only the provider adapter is faked; the procedure, the send use-case, the
// quota check and persistence all run for real against the test database.
const { sendOneToOneMock, adapterMock } = vi.hoisted(() => {
  const sendOneToOneMock = vi.fn();
  return { sendOneToOneMock, adapterMock: { sendOneToOne: sendOneToOneMock } };
});

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

vi.mock("@/modules/mails/lib/core", () => ({
  resolveAdapter: vi.fn(async () => adapterMock),
  getProviderAdapter: vi.fn(() => adapterMock),
}));

import { createCallerFactory } from "@/trpc/init";

import { EmailProvider } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { conversationsRouter } from "../procedures";

const createCaller = createCallerFactory(conversationsRouter);

const accountIds: string[] = [];
const userIds: string[] = [];

let caller: ReturnType<typeof createCaller>;
let userId: string;

async function resetTables() {
  await db.emailSendLog.deleteMany({});
  await db.emailSetting.deleteMany({});
  await db.emailAccount.deleteMany({});
}

async function seedConversation() {
  const account = await db.emailAccount.create({
    data: {
      name: "Support",
      email: `support-${randomUUID()}@example.com`,
      displayName: "Support Team",
      userPermissions: { create: [{ userId }] },
    },
  });
  accountIds.push(account.id);

  const conversation = await db.conversation.create({
    data: {
      emailAccountId: account.id,
      contactEmail: "jessica@example.com",
      contactName: "Jessica Ball",
    },
  });

  await db.emailMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "INBOUND",
      status: "RECEIVED",
      subject: "Query about socks",
      bodyText: "Original query",
      fromAddress: "jessica@example.com",
      toAddresses: [account.email],
      ccAddresses: [],
      bccAddresses: [],
      sentAt: new Date(),
    },
  });

  return { account, conversation };
}

beforeEach(async () => {
  await resetTables();
  accountIds.length = 0;
  userIds.length = 0;
  sendOneToOneMock.mockReset();
  sendOneToOneMock.mockResolvedValue({ success: true, externalId: "provider-1" });

  const user = await db.user.create({
    data: { email: `user-${randomUUID()}@example.com` },
  });
  userId = user.id;
  userIds.push(user.id);
  caller = createCaller({ userId: user.id, auth: { id: user.id } });
});

afterEach(async () => {
  await resetTables();
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  accountIds.length = 0;
  userIds.length = 0;
});

describe("conversations.sendReply end-to-end", () => {
  it("sends through the resolved adapter and persists the outbound message", async () => {
    await db.emailSetting.create({
      data: { emailProvider: EmailProvider.RESEND, maxEmailsPerDay: 100 },
    });
    const { conversation } = await seedConversation();

    const result = await caller.sendReply({
      conversationId: conversation.id,
      bodyHtml: "<p>Thanks for reaching out</p>",
      attachments: [
        {
          filename: "quote.pdf",
          contentType: "application/pdf",
          url: "https://files.test/quote.pdf",
          size: 1234,
        },
      ],
    });

    expect(sendOneToOneMock).toHaveBeenCalledTimes(1);
    expect(sendOneToOneMock.mock.calls[0][0]).toMatchObject({
      to: "jessica@example.com",
      subject: "Re: Query about socks",
      html: "<p>Thanks for reaching out</p>",
      text: "Thanks for reaching out",
    });

    const message = await db.emailMessage.findUniqueOrThrow({
      where: { id: result.messageId },
      include: { attachments: true },
    });

    expect(message).toMatchObject({
      conversationId: conversation.id,
      direction: "OUTBOUND",
      status: "SENT",
      externalId: "provider-1",
    });
    expect(message.attachments).toHaveLength(1);
    expect(message.attachments[0]).toMatchObject({
      filename: "quote.pdf",
      contentType: "application/pdf",
      size: 1234,
      url: "https://files.test/quote.pdf",
    });
  });

  it("enforces the quota and never calls the adapter", async () => {
    await db.emailSetting.create({
      data: { emailProvider: EmailProvider.RESEND, maxEmailsPerDay: 1 },
    });
    await db.emailSendLog.create({
      data: {
        to: "reader@example.com",
        from: "sender@example.com",
        subject: "Order confirmed",
        type: "order_confirmation",
      },
    });
    const { conversation } = await seedConversation();

    await expect(
      caller.sendReply({
        conversationId: conversation.id,
        bodyHtml: "<p>Thanks</p>",
      }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    expect(sendOneToOneMock).not.toHaveBeenCalled();
    expect(await db.emailMessage.count({ where: { direction: "OUTBOUND" } })).toBe(
      0,
    );
  });
});
