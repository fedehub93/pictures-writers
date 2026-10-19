import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EmailProvider } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import type {
  EmailProviderAdapter,
  SendOneToOneParams,
} from "@/modules/mails/lib/types";
import { providerAdapterStubs } from "@/modules/mails/lib/__tests__/inbound-adapter-stubs";

import {
  ConversationSendError,
  sendConversationMessage,
} from "../send-one-to-one";

function recordingAdapter(
  options: { success?: boolean; externalId?: string; error?: string } = {},
) {
  const sent: SendOneToOneParams[] = [];

  const adapter: EmailProviderAdapter = {
    ...providerAdapterStubs,
    sendOneToOne: async (params) => {
      sent.push(params);
      if (options.success === false) {
        return { success: false, error: options.error ?? "provider boom" };
      }
      return { success: true, externalId: options.externalId ?? "provider-1" };
    },
  };

  return { adapter, sent };
}

async function createAccount(
  overrides: { displayName?: string | null; signature?: string | null } = {},
) {
  return db.emailAccount.create({
    data: {
      name: "Support",
      email: `support-${randomUUID()}@example.com`,
      displayName:
        overrides.displayName === undefined
          ? "Support Team"
          : overrides.displayName,
      signature:
        overrides.signature === undefined ? "Best,\nSupport" : overrides.signature,
    },
  });
}

async function createConversation(
  emailAccountId: string,
  overrides: { contactEmail?: string; contactName?: string | null } = {},
) {
  return db.conversation.create({
    data: {
      emailAccountId,
      contactEmail: overrides.contactEmail ?? "jessica@example.com",
      contactName: overrides.contactName ?? "Jessica Ball",
    },
  });
}

async function seedInboundMessage(conversationId: string, subject: string) {
  return db.emailMessage.create({
    data: {
      conversationId,
      direction: "INBOUND",
      status: "RECEIVED",
      subject,
      bodyText: "Original query",
      fromAddress: "jessica@example.com",
      toAddresses: ["support@example.com"],
      ccAddresses: [],
      bccAddresses: [],
      messageId: "<orig@example.com>",
      sentAt: new Date(),
    },
  });
}

async function resetTables() {
  await db.emailSendLog.deleteMany({});
  await db.emailSetting.deleteMany({});
  await db.emailAccount.deleteMany({});
}

describe("sendConversationMessage", () => {
  beforeEach(resetTables);
  afterEach(resetTables);

  it("sends through the adapter and records the outbound message", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.id);
    await seedInboundMessage(conversation.id, "Query about socks");
    const { adapter, sent } = recordingAdapter();

    const result = await sendConversationMessage({
      conversationId: conversation.id,
      bodyHtml: "<p>Thanks for reaching out</p>",
      bodyText: "Thanks for reaching out",
      attachments: [
        {
          filename: "quote.pdf",
          contentType: "application/pdf",
          url: "https://files.test/quote.pdf",
        },
      ],
      adapter,
    });

    expect(result.providerId).toBe("provider-1");
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      to: "jessica@example.com",
      from: `Support Team <${account.email}>`,
      subject: "Re: Query about socks",
      html: "<p>Thanks for reaching out</p>",
      text: "Thanks for reaching out",
      replyTo: account.email,
      attachments: [
        {
          filename: "quote.pdf",
          contentType: "application/pdf",
          url: "https://files.test/quote.pdf",
        },
      ],
    });

    const message = await db.emailMessage.findUniqueOrThrow({
      where: { id: result.messageId },
      include: { attachments: true },
    });

    expect(message).toMatchObject({
      conversationId: conversation.id,
      direction: "OUTBOUND",
      status: "SENT",
      subject: "Re: Query about socks",
      fromAddress: `Support Team <${account.email}>`,
      toAddresses: ["jessica@example.com"],
      externalId: "provider-1",
      inReplyTo: "<orig@example.com>",
    });
    expect(message.sentAt).not.toBeNull();
    expect(message.attachments).toHaveLength(1);
    expect(message.attachments[0]).toMatchObject({
      filename: "quote.pdf",
      contentType: "application/pdf",
      url: "https://files.test/quote.pdf",
    });
  });

  it("uses an explicit subject when provided", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.id);
    await seedInboundMessage(conversation.id, "Query");
    const { adapter, sent } = recordingAdapter();

    await sendConversationMessage({
      conversationId: conversation.id,
      bodyHtml: "<p>Hi</p>",
      subject: "Custom subject",
      adapter,
    });

    expect(sent[0]!.subject).toBe("Custom subject");
  });

  it("falls back to the account name when no display name is set", async () => {
    const account = await createAccount({ displayName: null });
    const conversation = await createConversation(account.id);
    const { adapter, sent } = recordingAdapter();

    await sendConversationMessage({
      conversationId: conversation.id,
      bodyHtml: "<p>Hi</p>",
      adapter,
    });

    expect(sent[0]!.from).toBe(`Support <${account.email}>`);
  });

  it("bumps the conversation's activity so the thread floats to the top", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.id);
    const before = conversation.updatedAt;
    const { adapter } = recordingAdapter();

    await new Promise((resolve) => setTimeout(resolve, 5));

    await sendConversationMessage({
      conversationId: conversation.id,
      bodyHtml: "<p>Hi</p>",
      adapter,
    });

    const updated = await db.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
    });
    expect(updated.updatedAt.getTime()).toBeGreaterThan(before.getTime());
  });

  it("rejects with NOT_FOUND for an unknown conversation", async () => {
    const { adapter } = recordingAdapter();

    await expect(
      sendConversationMessage({
        conversationId: randomUUID(),
        bodyHtml: "<p>Hi</p>",
        adapter,
      }),
    ).rejects.toSatisfy(
      (error: ConversationSendError) => error.code === "NOT_FOUND",
    );
  });

  it("enforces the daily quota before invoking the provider", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.id);

    await db.emailSetting.create({
      data: { emailProvider: EmailProvider.RESEND, maxEmailsPerDay: 1 },
    });
    // One transactional/systems send already recorded today exhausts the quota.
    await db.emailSendLog.create({
      data: {
        to: "reader@example.com",
        from: "sender@example.com",
        subject: "Order confirmed",
        type: "order_confirmation",
      },
    });

    const { adapter, sent } = recordingAdapter();

    await expect(
      sendConversationMessage({
        conversationId: conversation.id,
        bodyHtml: "<p>Hi</p>",
        adapter,
      }),
    ).rejects.toSatisfy(
      (error: ConversationSendError) => error.code === "QUOTA_EXCEEDED",
    );

    expect(sent).toHaveLength(0);
    expect(await db.emailMessage.count()).toBe(0);
  });

  it("counts outbound one-to-one messages against the quota", async () => {
    const account = await createAccount();
    const firstConversation = await createConversation(account.id);
    const secondConversation = await createConversation(account.id, {
      contactEmail: "other@example.com",
    });

    await db.emailSetting.create({
      data: { emailProvider: EmailProvider.RESEND, maxEmailsPerDay: 1 },
    });

    const { adapter, sent } = recordingAdapter();
    await sendConversationMessage({
      conversationId: firstConversation.id,
      bodyHtml: "<p>First</p>",
      adapter,
    });
    expect(sent).toHaveLength(1);

    await expect(
      sendConversationMessage({
        conversationId: secondConversation.id,
        bodyHtml: "<p>Second</p>",
        adapter,
      }),
    ).rejects.toSatisfy(
      (error: ConversationSendError) => error.code === "QUOTA_EXCEEDED",
    );
    expect(sent).toHaveLength(1);
  });

  it("propagates a provider failure without recording a message", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.id);
    const { adapter } = recordingAdapter({
      success: false,
      error: "domain not verified",
    });

    await expect(
      sendConversationMessage({
        conversationId: conversation.id,
        bodyHtml: "<p>Hi</p>",
        adapter,
      }),
    ).rejects.toSatisfy(
      (error: ConversationSendError) =>
        error.code === "PROVIDER_ERROR" &&
        error.message === "domain not verified",
    );

    expect(await db.emailMessage.count()).toBe(0);
  });
});
