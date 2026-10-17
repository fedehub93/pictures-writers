import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveAdapter } from "@/modules/mails/lib/provider";
import { handleInboundEmail } from "@/modules/mails/conversations/lib/handle-inbound-email";
import type { EmailProviderAdapter } from "@/modules/mails/lib/types";
import { inboundAdapterStubs } from "@/modules/mails/lib/__tests__/inbound-adapter-stubs";

import { POST } from "./route";

vi.mock("@/modules/mails/lib/provider", () => ({
  resolveAdapter: vi.fn(),
}));

vi.mock("@/modules/mails/conversations/lib/handle-inbound-email", () => ({
  handleInboundEmail: vi.fn(),
}));

vi.mock("@/modules/mails/conversations/lib/attachment-storage", () => ({
  createUploadThingStorage: vi.fn(() => ({
    store: vi.fn(async () => ({ url: "https://storage.test/file" })),
  })),
}));

function makeRequest(options: { signed?: boolean; body?: string } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (options.signed !== false) {
    headers.set("svix-id", "msg_1");
    headers.set("svix-timestamp", "1234567890");
    headers.set("svix-signature", "v1,abc");
  }

  return new Request("http://localhost/api/webhooks/resend", {
    method: "POST",
    headers,
    body: options.body ?? JSON.stringify({ type: "email.received" }),
  });
}

function makeAdapter(
  verifyWebhook: EmailProviderAdapter["verifyWebhook"],
): EmailProviderAdapter {
  return {
    ...inboundAdapterStubs,
    verifyWebhook,
    syncSegment: async () => ({ errors: [] }),
    syncContactsBatch: async () => ({
      success: true,
      totalProcessed: 0,
      successfulCount: 0,
      failedCount: 0,
      errors: [],
      syncedContacts: [],
    }),
    addContactsToSegment: async () => ({
      success: true,
      totalProcessed: 0,
      successfulCount: 0,
      failedCount: 0,
      errors: [],
      syncedContacts: [],
    }),
    createContact: async () => ({ errors: [] }),
    deleteContact: async () => ({ errors: [] }),
    upsertContact: async () => ({ errors: [], externalId: "ext" }),
    deleteSegment: async () => ({ errors: [] }),
    sendBulk: async () => ({ success: true }),
  };
}

describe("POST /api/webhooks/resend", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_RESEND_WEBHOOK_SECRET = "whsec_test";
  });

  afterEach(() => {
    delete process.env.NEXT_RESEND_WEBHOOK_SECRET;
    vi.restoreAllMocks();
  });

  it("returns 400 when the signature headers are missing", async () => {
    const response = await POST(makeRequest({ signed: false }));

    expect(response.status).toBe(400);
    expect(handleInboundEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when the signature is rejected", async () => {
    vi.mocked(resolveAdapter).mockResolvedValue(
      makeAdapter(() => {
        throw new Error("bad signature");
      }),
    );

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    expect(handleInboundEmail).not.toHaveBeenCalled();
  });

  it("returns 500 when no provider is configured", async () => {
    vi.mocked(resolveAdapter).mockRejectedValue(new Error("not configured"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
  });

  it("ignores events that are not email.received", async () => {
    vi.mocked(resolveAdapter).mockResolvedValue(
      makeAdapter(() => ({ type: "email.delivered", data: {} })),
    );

    const response = await POST(makeRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual({ status: "ignored" });
    expect(handleInboundEmail).not.toHaveBeenCalled();
  });

  it("routes a verified email.received event to the inbound handler", async () => {
    const eventData = {
      email_id: "inbound-1",
      message_id: "<msg-1@example.com>",
      from: "alice@example.com",
      to: ["support@example.com"],
      cc: [],
      bcc: [],
      received_for: ["support@example.com"],
      subject: "Hello",
      created_at: "2026-10-17T10:00:00.000Z",
    };
    const adapter = makeAdapter(() => ({
      type: "email.received",
      data: eventData,
    }));
    vi.mocked(resolveAdapter).mockResolvedValue(adapter);
    vi.mocked(handleInboundEmail).mockResolvedValue({
      status: "processed",
      conversationId: "conversation-1",
      messageId: "message-1",
    });

    const response = await POST(makeRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual({
      status: "processed",
      conversationId: "conversation-1",
      messageId: "message-1",
    });
    expect(handleInboundEmail).toHaveBeenCalledWith(
      eventData,
      expect.objectContaining({ adapter }),
    );
  });

  it("returns 500 when the handler throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(resolveAdapter).mockResolvedValue(
      makeAdapter(() => ({
        type: "email.received",
        data: { email_id: "inbound-1" },
      })),
    );
    vi.mocked(handleInboundEmail).mockRejectedValue(new Error("db down"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
  });
});
