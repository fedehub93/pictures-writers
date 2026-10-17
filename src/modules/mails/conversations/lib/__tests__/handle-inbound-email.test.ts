import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import type {
  EmailInboundAdapter,
  InboundEmail,
  InboundWebhookData,
} from "@/modules/mails/lib/types";

import type { AttachmentStorage } from "../attachment-storage";
import { handleInboundEmail } from "../handle-inbound-email";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ACCOUNT_EMAIL = "support@example.com";

function webhookEvent(
  overrides: Partial<InboundWebhookData> = {},
): InboundWebhookData {
  return {
    email_id: "inbound-1",
    message_id: "<msg-1@example.com>",
    from: "Alice <alice@example.com>",
    to: [ACCOUNT_EMAIL],
    cc: [],
    bcc: [],
    received_for: [ACCOUNT_EMAIL],
    subject: "Hello",
    created_at: "2026-10-17T10:00:00.000Z",
    ...overrides,
  };
}

function inboundEmail(overrides: Partial<InboundEmail> = {}): InboundEmail {
  return {
    externalId: "inbound-1",
    messageId: "<msg-1@example.com>",
    references: [],
    from: "Alice <alice@example.com>",
    to: [ACCOUNT_EMAIL],
    cc: [],
    bcc: [],
    subject: "Hello",
    bodyHtml: "<p>Hi</p>",
    bodyText: "Hi",
    receivedAt: new Date("2026-10-17T10:00:00.000Z"),
    attachments: [],
    ...overrides,
  };
}

function makeAdapter(inbound: InboundEmail): EmailInboundAdapter {
  return {
    verifyWebhook: () => ({ type: "ignored", data: null }),
    fetchInbound: async () => inbound,
    listInboundAttachments: async () => inbound.attachments,
    getAttachmentDownloadUrl: async (_emailId, attachmentId) => ({
      url: `https://provider.test/${attachmentId}`,
    }),
  };
}

function makeStorage(): {
  storage: AttachmentStorage;
  stored: { filename: string; contentType: string; sourceUrl: string }[];
} {
  const stored: { filename: string; contentType: string; sourceUrl: string }[] =
    [];
  return {
    stored,
    storage: {
      async store(params) {
        stored.push(params);
        return { url: `https://storage.test/${params.filename}` };
      },
    },
  };
}

describe("handleInboundEmail", () => {
  const createdAccountIds: string[] = [];

  async function createAccount(
    overrides: { email?: string; isActive?: boolean } = {},
  ) {
    const account = await db.emailAccount.create({
      data: {
        name: "Support",
        email: overrides.email ?? ACCOUNT_EMAIL,
        isActive: overrides.isActive ?? true,
      },
    });
    createdAccountIds.push(account.id);
    return account;
  }

  beforeEach(async () => {
    await db.emailAccount.deleteMany({});
    createdAccountIds.length = 0;
  });

  afterEach(async () => {
    if (createdAccountIds.length > 0) {
      await db.emailAccount.deleteMany({
        where: { id: { in: createdAccountIds } },
      });
    }
    createdAccountIds.length = 0;
  });

  it("records the conversation, message and attachments and marks it unread", async () => {
    const account = await createAccount();
    const { storage, stored } = makeStorage();
    const inbound = inboundEmail({
      attachments: [
        {
          externalId: "att-1",
          filename: "report.pdf",
          contentType: "application/pdf",
          size: 1234,
        },
      ],
    });

    const result = await handleInboundEmail(webhookEvent(), {
      adapter: makeAdapter(inbound),
      storage,
    });

    expect(result.status).toBe("processed");

    const conversation = await db.conversation.findFirst({
      where: { emailAccountId: account.id },
      include: { messages: { include: { attachments: true } } },
    });

    expect(conversation).not.toBeNull();
    expect(conversation!.contactEmail).toBe("alice@example.com");
    expect(conversation!.contactName).toBe("Alice");
    expect(conversation!.hasUnread).toBe(true);
    expect(conversation!.messages).toHaveLength(1);

    const message = conversation!.messages[0];
    expect(message.direction).toBe("INBOUND");
    expect(message.status).toBe("RECEIVED");
    expect(message.subject).toBe("Hello");
    expect(message.fromAddress).toBe("Alice <alice@example.com>");
    expect(message.toAddresses).toEqual([ACCOUNT_EMAIL]);
    expect(message.externalId).toBe("inbound-1");

    expect(message.attachments).toHaveLength(1);
    expect(message.attachments[0]).toMatchObject({
      filename: "report.pdf",
      contentType: "application/pdf",
      size: 1234,
      externalId: "att-1",
      url: "https://storage.test/report.pdf",
    });

    // The provider URL was copied into application storage.
    expect(stored).toEqual([
      {
        filename: "report.pdf",
        contentType: "application/pdf",
        sourceUrl: "https://provider.test/att-1",
      },
    ]);
  });

  it("reuses the conversation for the same contact across messages", async () => {
    await createAccount();
    const { storage } = makeStorage();

    await handleInboundEmail(webhookEvent({ email_id: "inbound-1" }), {
      adapter: makeAdapter(inboundEmail({ externalId: "inbound-1" })),
      storage,
    });
    await handleInboundEmail(webhookEvent({ email_id: "inbound-2" }), {
      adapter: makeAdapter(
        inboundEmail({ externalId: "inbound-2", subject: "Re: Hello" }),
      ),
      storage,
    });

    const conversations = await db.conversation.findMany({
      include: { messages: true },
    });

    expect(conversations).toHaveLength(1);
    expect(conversations[0].messages).toHaveLength(2);
    expect(conversations[0].hasUnread).toBe(true);
  });

  it("discards mail addressed to an unknown account", async () => {
    const { storage } = makeStorage();

    const result = await handleInboundEmail(
      webhookEvent({ to: ["nobody@example.com"], received_for: [] }),
      { adapter: makeAdapter(inboundEmail()), storage },
    );

    expect(result).toEqual({ status: "discarded", reason: "unknown-account" });
    expect(await db.conversation.count()).toBe(0);
    expect(await db.emailMessage.count()).toBe(0);
  });

  it("discards mail for an inactive account", async () => {
    await createAccount({ isActive: false });
    const { storage } = makeStorage();

    const result = await handleInboundEmail(webhookEvent(), {
      adapter: makeAdapter(inboundEmail()),
      storage,
    });

    expect(result.status).toBe("discarded");
    expect(await db.emailMessage.count()).toBe(0);
  });

  it("does not duplicate a retried webhook event", async () => {
    await createAccount();
    const { storage } = makeStorage();
    const adapter = makeAdapter(inboundEmail());

    const first = await handleInboundEmail(webhookEvent(), {
      adapter,
      storage,
    });
    const second = await handleInboundEmail(webhookEvent(), {
      adapter,
      storage,
    });

    expect(second).toEqual(first);
    expect(await db.emailMessage.count()).toBe(1);
  });

  it("records a message with no attachments without touching storage", async () => {
    await createAccount();
    const { storage, stored } = makeStorage();

    await handleInboundEmail(webhookEvent(), {
      adapter: makeAdapter(inboundEmail({ attachments: [] })),
      storage,
    });

    expect(stored).toHaveLength(0);
    const message = await db.emailMessage.findFirst();
    expect(message).not.toBeNull();
  });

  it("matches the recipient case-insensitively", async () => {
    await createAccount({ email: "Support@Example.com" });
    const { storage } = makeStorage();

    const result = await handleInboundEmail(
      webhookEvent({ to: ["support@example.com"], received_for: [] }),
      { adapter: makeAdapter(inboundEmail()), storage },
    );

    expect(result.status).toBe("processed");
  });
});
