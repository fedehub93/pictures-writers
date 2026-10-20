import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EmailProvider } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import type {
  EmailProviderAdapter,
  SendOneToOneParams,
} from "@/modules/mails/lib/types";
import { providerAdapterStubs } from "@/modules/mails/lib/__tests__/inbound-adapter-stubs";

import { NewMessageError, sendNewMessage } from "../send-new-message";

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
  overrides: { displayName?: string | null } = {},
) {
  return db.emailAccount.create({
    data: {
      name: "Support",
      email: `support-${randomUUID()}@example.com`,
      displayName:
        overrides.displayName === undefined
          ? "Support Team"
          : overrides.displayName,
    },
  });
}

async function resetTables() {
  await db.emailSendLog.deleteMany({});
  await db.emailSetting.deleteMany({});
  await db.emailAccount.deleteMany({});
  await db.emailContact.deleteMany({});
}

describe("sendNewMessage", () => {
  beforeEach(resetTables);
  afterEach(resetTables);

  it("creates a conversation and records the outbound message", async () => {
    const account = await createAccount();
    const { adapter, sent } = recordingAdapter();

    const result = await sendNewMessage({
      emailAccountId: account.id,
      to: "newcomer@example.com",
      subject: "Hello there",
      bodyHtml: "<p>Nice to meet you</p>",
      bodyText: "Nice to meet you",
      attachments: [
        {
          filename: "intro.pdf",
          contentType: "application/pdf",
          url: "https://files.test/intro.pdf",
        },
      ],
      adapter,
    });

    expect(result.providerId).toBe("provider-1");
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      to: "newcomer@example.com",
      from: `Support Team <${account.email}>`,
      subject: "Hello there",
      html: "<p>Nice to meet you</p>",
      text: "Nice to meet you",
      replyTo: account.email,
    });

    const message = await db.emailMessage.findUniqueOrThrow({
      where: { id: result.messageId },
      include: { attachments: true, conversation: true },
    });

    expect(message).toMatchObject({
      direction: "OUTBOUND",
      status: "SENT",
      subject: "Hello there",
      fromAddress: `Support Team <${account.email}>`,
      toAddresses: ["newcomer@example.com"],
      externalId: "provider-1",
      conversationId: result.conversationId,
    });
    expect(message.conversation).toMatchObject({
      emailAccountId: account.id,
      contactEmail: "newcomer@example.com",
      contactId: null,
      lastInboundAt: null,
    });
    expect(message.conversation.lastMessageAt).toEqual(message.sentAt);
    expect(message.attachments).toHaveLength(1);
    expect(message.attachments[0]).toMatchObject({
      filename: "intro.pdf",
      contentType: "application/pdf",
      url: "https://files.test/intro.pdf",
    });
  });

  it("does not auto-create a contact for an unknown recipient", async () => {
    const account = await createAccount();
    const { adapter } = recordingAdapter();

    await sendNewMessage({
      emailAccountId: account.id,
      to: "stranger@example.com",
      subject: "Hi",
      bodyHtml: "<p>Hi</p>",
      adapter,
    });

    expect(
      await db.emailContact.count({
        where: { email: "stranger@example.com" },
      }),
    ).toBe(0);
  });

  it("links an existing contact and uses its name", async () => {
    const account = await createAccount();
    const contact = await db.emailContact.create({
      data: { email: "jessica@example.com", firstName: "Jessica", lastName: "Ball" },
    });
    const { adapter } = recordingAdapter();

    const result = await sendNewMessage({
      emailAccountId: account.id,
      to: "jessica@example.com",
      subject: "Hi",
      bodyHtml: "<p>Hi</p>",
      adapter,
    });

    const conversation = await db.conversation.findUniqueOrThrow({
      where: { id: result.conversationId },
    });

    expect(conversation.contactId).toBe(contact.id);
    expect(conversation.contactName).toBe("Jessica Ball");
  });

  it("reuses an existing conversation for the same address", async () => {
    const account = await createAccount();
    const existing = await db.conversation.create({
      data: {
        emailAccountId: account.id,
        contactEmail: "reuse@example.com",
        contactName: "Reuse Me",
      },
    });
    await db.emailMessage.create({
      data: {
        conversationId: existing.id,
        direction: "INBOUND",
        status: "RECEIVED",
        messageId: "<orig@example.com>",
        fromAddress: "reuse@example.com",
        toAddresses: [account.email],
        ccAddresses: [],
        bccAddresses: [],
        sentAt: new Date(),
      },
    });
    const { adapter } = recordingAdapter();

    const result = await sendNewMessage({
      emailAccountId: account.id,
      to: "reuse@example.com",
      subject: "Again",
      bodyHtml: "<p>Again</p>",
      adapter,
    });

    expect(result.conversationId).toBe(existing.id);
    expect(await db.conversation.count()).toBe(1);

    const message = await db.emailMessage.findUniqueOrThrow({
      where: { id: result.messageId },
    });
    expect(message.direction).toBe("OUTBOUND");
  });

  it("unarchives a reused conversation so the sent message lands in the inbox", async () => {
    const account = await createAccount();
    const archived = await db.conversation.create({
      data: {
        emailAccountId: account.id,
        contactEmail: "archived@example.com",
        archivedAt: new Date(),
      },
    });
    const { adapter } = recordingAdapter();

    await sendNewMessage({
      emailAccountId: account.id,
      to: "archived@example.com",
      subject: "Hello again",
      bodyHtml: "<p>Hello again</p>",
      adapter,
    });

    const updated = await db.conversation.findUniqueOrThrow({
      where: { id: archived.id },
    });
    expect(updated.archivedAt).toBeNull();
  });

  it("enforces the daily quota before invoking the provider", async () => {
    const account = await createAccount();
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
    const { adapter, sent } = recordingAdapter();

    await expect(
      sendNewMessage({
        emailAccountId: account.id,
        to: "newcomer@example.com",
        subject: "Hi",
        bodyHtml: "<p>Hi</p>",
        adapter,
      }),
    ).rejects.toSatisfy(
      (error: NewMessageError) => error.code === "QUOTA_EXCEEDED",
    );

    expect(sent).toHaveLength(0);
    expect(await db.emailMessage.count()).toBe(0);
    expect(await db.conversation.count()).toBe(0);
  });

  it("rejects an unknown account", async () => {
    const { adapter } = recordingAdapter();

    await expect(
      sendNewMessage({
        emailAccountId: randomUUID(),
        to: "newcomer@example.com",
        subject: "Hi",
        bodyHtml: "<p>Hi</p>",
        adapter,
      }),
    ).rejects.toSatisfy(
      (error: NewMessageError) => error.code === "ACCOUNT_NOT_FOUND",
    );
  });

  it("propagates a provider failure without recording anything", async () => {
    const account = await createAccount();
    const { adapter } = recordingAdapter({
      success: false,
      error: "domain not verified",
    });

    await expect(
      sendNewMessage({
        emailAccountId: account.id,
        to: "newcomer@example.com",
        subject: "Hi",
        bodyHtml: "<p>Hi</p>",
        adapter,
      }),
    ).rejects.toSatisfy(
      (error: NewMessageError) =>
        error.code === "PROVIDER_ERROR" &&
        error.message === "domain not verified",
    );

    expect(await db.emailMessage.count()).toBe(0);
    expect(await db.conversation.count()).toBe(0);
  });
});
