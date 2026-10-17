import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { ResendAdapter } from "../resend-adapter";

/**
 * Fake Resend client whose responses are driven per-test via vi.fn().
 * Injected into the adapter's private `resendClient` field.
 */
type FakeResendClient = {
  contacts: {
    get: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    segments: {
      list: ReturnType<typeof vi.fn>;
      add: ReturnType<typeof vi.fn>;
      remove: ReturnType<typeof vi.fn>;
    };
  };
  broadcasts: {
    create: ReturnType<typeof vi.fn>;
  };
  emails: {
    send: ReturnType<typeof vi.fn>;
    receiving: {
      get: ReturnType<typeof vi.fn>;
      attachments: {
        list: ReturnType<typeof vi.fn>;
        get: ReturnType<typeof vi.fn>;
      };
    };
  };
  webhooks: {
    verify: ReturnType<typeof vi.fn>;
  };
};

function createFakeClient(): FakeResendClient {
  return {
    contacts: {
      get: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      segments: {
        list: vi.fn(),
        add: vi.fn(),
        remove: vi.fn(),
      },
    },
    broadcasts: {
      create: vi.fn(),
    },
    emails: {
      send: vi.fn(),
      receiving: {
        get: vi.fn(),
        attachments: {
          list: vi.fn(),
          get: vi.fn(),
        },
      },
    },
    webhooks: {
      verify: vi.fn(),
    },
  };
}

function makeAdapter(fake: FakeResendClient): ResendAdapter {
  const adapter = new ResendAdapter();
  (adapter as unknown as { resendClient: unknown }).resendClient = fake;
  return adapter;
}

const ok = { error: null };

beforeEach(() => {
  process.env.NEXT_RESEND_KEY = "re_test_dummy";
});

afterEach(() => {
  delete process.env.NEXT_RESEND_KEY;
});

// ─── upsertContact — update path (contact exists) ───────────────────────────

describe("ResendAdapter.upsertContact (update path)", () => {
  it("does NOT send segments in contacts.update and reconciles membership via segments.*", async () => {
    const fake = createFakeClient();
    fake.contacts.get.mockResolvedValue({
      data: { id: "contact-1", object: "contact", email: "alice@example.com", created_at: "t", first_name: null, last_name: null, unsubscribed: false, properties: {} },
      ...ok,
    });
    fake.contacts.update.mockResolvedValue({ data: { id: "contact-1", object: "contact" }, ...ok });
    // Currently on "seg-current", desired is "seg-want"
    fake.contacts.segments.list.mockResolvedValue({
      data: { data: [{ id: "seg-current" }], has_more: false },
      ...ok,
    });
    fake.contacts.segments.add.mockResolvedValue({ data: { id: "seg-want" }, ...ok });
    fake.contacts.segments.remove.mockResolvedValue({
      data: { id: "seg-current", audienceId: "seg-current", deleted: true },
      ...ok,
    });

    const adapter = makeAdapter(fake);
    const result = await adapter.upsertContact(
      "alice@example.com",
      "local-1",
      "Alice",
      undefined,
      true,
      [{ externalId: "seg-want" }],
    );

    expect(result.errors).toEqual([]);
    expect(result.externalId).toBe("contact-1");

    // contacts.update must NOT carry a segments field
    const updateArgs = fake.contacts.update.mock.calls[0][0];
    expect(updateArgs.segments).toBeUndefined();

    // Missing membership → added
    expect(fake.contacts.segments.add).toHaveBeenCalledWith({
      email: "alice@example.com",
      segmentId: "seg-want",
    });
    // Stale membership → removed
    expect(fake.contacts.segments.remove).toHaveBeenCalledWith({
      email: "alice@example.com",
      segmentId: "seg-current",
    });
  });

  it("skips add/remove when memberships already match", async () => {
    const fake = createFakeClient();
    fake.contacts.get.mockResolvedValue({
      data: { id: "contact-1", object: "contact", email: "a@example.com", created_at: "t", first_name: null, last_name: null, unsubscribed: false, properties: {} },
      ...ok,
    });
    fake.contacts.update.mockResolvedValue({ data: { id: "contact-1", object: "contact" }, ...ok });
    fake.contacts.segments.list.mockResolvedValue({
      data: { data: [{ id: "seg-a" }], has_more: false },
      ...ok,
    });

    const adapter = makeAdapter(fake);
    const result = await adapter.upsertContact(
      "a@example.com",
      "local-1",
      undefined,
      undefined,
      true,
      [{ externalId: "seg-a" }],
    );

    expect(result.errors).toEqual([]);
    expect(fake.contacts.segments.add).not.toHaveBeenCalled();
    expect(fake.contacts.segments.remove).not.toHaveBeenCalled();
  });

  it("surfaces errors when listing current segments fails", async () => {
    const fake = createFakeClient();
    fake.contacts.get.mockResolvedValue({
      data: { id: "contact-1", object: "contact", email: "a@example.com", created_at: "t", first_name: null, last_name: null, unsubscribed: false, properties: {} },
      ...ok,
    });
    fake.contacts.update.mockResolvedValue({ data: { id: "contact-1", object: "contact" }, ...ok });
    fake.contacts.segments.list.mockResolvedValue({
      data: null,
      error: { message: "list boom", name: "list_failed" },
    });

    const adapter = makeAdapter(fake);
    const result = await adapter.upsertContact(
      "a@example.com",
      "local-1",
      undefined,
      undefined,
      true,
      [{ externalId: "seg-a" }],
    );

    expect(result.errors).toEqual([
      "Impossible to list contact segments: list boom",
    ]);
    expect(result.externalId).toBe("contact-1");
  });

  it("surfaces errors when adding a missing segment fails", async () => {
    const fake = createFakeClient();
    fake.contacts.get.mockResolvedValue({
      data: { id: "contact-1", object: "contact", email: "a@example.com", created_at: "t", first_name: null, last_name: null, unsubscribed: false, properties: {} },
      ...ok,
    });
    fake.contacts.update.mockResolvedValue({ data: { id: "contact-1", object: "contact" }, ...ok });
    fake.contacts.segments.list.mockResolvedValue({
      data: { data: [], has_more: false },
      ...ok,
    });
    fake.contacts.segments.add.mockResolvedValue({
      data: null,
      error: { message: "add boom", name: "add_failed" },
    });

    const adapter = makeAdapter(fake);
    const result = await adapter.upsertContact(
      "a@example.com",
      "local-1",
      undefined,
      undefined,
      true,
      [{ externalId: "seg-x" }],
    );

    expect(result.errors).toEqual([
      "Impossible to add segment seg-x: add boom",
    ]);
  });

  it("surfaces the update error and falls back to empty externalId", async () => {
    const fake = createFakeClient();
    fake.contacts.get.mockResolvedValue({
      data: { id: "contact-1", object: "contact", email: "a@example.com", created_at: "t", first_name: null, last_name: null, unsubscribed: false, properties: {} },
      ...ok,
    });
    fake.contacts.update.mockResolvedValue({
      data: null,
      error: { message: "update boom", name: "update_failed" },
    });

    const adapter = makeAdapter(fake);
    const result = await adapter.upsertContact(
      "a@example.com",
      "local-1",
      undefined,
      undefined,
      true,
      [{ externalId: "seg-a" }],
    );

    expect(result.errors).toEqual([
      "Impossible to upsert the contact: update boom",
    ]);
    expect(result.externalId).toBe("");
  });
});

// ─── upsertContact — create path (contact does not exist) ───────────────────

describe("ResendAdapter.upsertContact (create path)", () => {
  it("still sends segments on contacts.create for new contacts", async () => {
    const fake = createFakeClient();
    fake.contacts.get.mockResolvedValue({ data: null, ...ok });
    fake.contacts.create.mockResolvedValue({ data: { id: "contact-2" }, ...ok });

    const adapter = makeAdapter(fake);
    const result = await adapter.upsertContact(
      "b@example.com",
      "local-2",
      "Bob",
      undefined,
      true,
      [{ externalId: "seg-want" }],
    );

    expect(result.errors).toEqual([]);
    expect(result.externalId).toBe("contact-2");

    const createArgs = fake.contacts.create.mock.calls[0][0];
    expect(createArgs.segments).toEqual([{ id: "seg-want" }]);
  });
});

// ─── addContactsToSegment ────────────────────────────────────────────────────

describe("ResendAdapter.addContactsToSegment", () => {
  it("adds membership for existing contacts and creates new ones, mapping syncedContacts", async () => {
    const fake = createFakeClient();
    fake.contacts.segments.add.mockResolvedValue({
      data: { segmentId: "seg-1" },
      ...ok,
    });
    fake.contacts.create.mockResolvedValue({
      data: { id: "new-contact-1" },
      ...ok,
    });

    const adapter = makeAdapter(fake);
    const result = await adapter.addContactsToSegment(
      [
        {
          email: "existing@example.com",
          id: "local-existing",
          externalId: "ext-existing",
        },
        { email: "new@example.com", id: "local-new" },
      ],
      "seg-1",
    );

    // Routing: existing → membership add, new → create
    expect(fake.contacts.segments.add).toHaveBeenCalledTimes(1);
    expect(fake.contacts.segments.add).toHaveBeenCalledWith({
      email: "existing@example.com",
      segmentId: "seg-1",
    });
    expect(fake.contacts.create).toHaveBeenCalledTimes(1);

    // New contact created with the segment attached + external_id property
    const createArgs = fake.contacts.create.mock.calls[0][0];
    expect(createArgs.email).toBe("new@example.com");
    expect(createArgs.segments).toEqual([{ id: "seg-1" }]);
    expect(createArgs.properties).toEqual({ external_id: "local-new" });

    // syncedContacts only contains the created contact
    expect(result.success).toBe(true);
    expect(result.totalProcessed).toBe(2);
    expect(result.successfulCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(result.syncedContacts).toEqual([
      { localId: "local-new", externalId: "new-contact-1" },
    ]);
  });

  it("aggregates per-contact errors without aborting the rest of the batch", async () => {
    const fake = createFakeClient();
    fake.contacts.create
      .mockResolvedValueOnce({
        data: null,
        error: {
          message: "invalid email",
          name: "validation_error",
          statusCode: 422,
        },
      })
      .mockResolvedValueOnce({
        data: { id: "ok-1" },
        ...ok,
      });

    const adapter = makeAdapter(fake);
    const result = await adapter.addContactsToSegment(
      [
        { email: "bad@example.com", id: "local-bad" },
        { email: "ok@example.com", id: "local-ok" },
      ],
      "seg-1",
    );

    expect(result.success).toBe(false);
    expect(result.totalProcessed).toBe(2);
    expect(result.successfulCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.errors).toEqual([
      { email: "bad@example.com", reason: "invalid email" },
    ]);
    expect(result.syncedContacts).toEqual([
      { localId: "local-ok", externalId: "ok-1" },
    ]);
  });

  it("retries on 429 with exponential backoff and succeeds", async () => {
    vi.useFakeTimers();
    try {
      const fake = createFakeClient();
      fake.contacts.create
        .mockResolvedValueOnce({
          data: null,
          error: {
            message: "rate limit",
            name: "rate_limit_exceeded",
            statusCode: 429,
          },
        })
        .mockResolvedValueOnce({
          data: { id: "contact-1" },
          ...ok,
        });

      const adapter = makeAdapter(fake);
      const promise = adapter.addContactsToSegment(
        [{ email: "a@example.com", id: "local-1" }],
        "seg-1",
      );

      await vi.advanceTimersByTimeAsync(10000);
      const result = await promise;

      expect(fake.contacts.create).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.successfulCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.syncedContacts).toEqual([
        { localId: "local-1", externalId: "contact-1" },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("paces chunks with a delay between them", async () => {
    vi.useFakeTimers();
    try {
      const fake = createFakeClient();
      fake.contacts.create.mockResolvedValue({
        data: { id: "c" },
        ...ok,
      });

      const contacts = Array.from({ length: 9 }, (_, i) => ({
        email: `c${i}@example.com`,
        id: `local-${i}`,
      }));

      const adapter = makeAdapter(fake);
      const promise = adapter.addContactsToSegment(contacts, "seg-1");

      // First chunk (8) runs immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(fake.contacts.create).toHaveBeenCalledTimes(8);

      // After the inter-chunk delay, the final contact is created
      await vi.advanceTimersByTimeAsync(1050);
      expect(fake.contacts.create).toHaveBeenCalledTimes(9);

      await promise;
    } finally {
      vi.useRealTimers();
    }
  });
});

// ─── sendBulk ────────────────────────────────────────────────────────────────

describe("ResendAdapter.sendBulk", () => {
  it("forwards previewText to broadcasts.create", async () => {
    const fake = createFakeClient();
    fake.broadcasts.create.mockResolvedValue({
      data: { id: "broadcast-1" },
      ...ok,
    });

    const adapter = makeAdapter(fake);
    const result = await adapter.sendBulk({
      segmentExternalId: "seg-1",
      subject: "Hello",
      html: "<p>Body</p>",
      from: "Test <test@example.com>",
      previewText: "A short teaser",
    });

    expect(result).toEqual({ success: true, externalCampaignId: "broadcast-1" });
    expect(fake.broadcasts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        segmentId: "seg-1",
        subject: "Hello",
        previewText: "A short teaser",
      }),
    );
  });

  it("omits previewText from broadcasts.create when absent", async () => {
    const fake = createFakeClient();
    fake.broadcasts.create.mockResolvedValue({
      data: { id: "broadcast-1" },
      ...ok,
    });

    const adapter = makeAdapter(fake);
    await adapter.sendBulk({
      segmentExternalId: "seg-1",
      subject: "Hello",
      html: "<p>Body</p>",
      from: "Test <test@example.com>",
    });

    const createArgs = fake.broadcasts.create.mock.calls[0][0];
    expect(createArgs.previewText).toBeUndefined();
  });
});

// ─── sendOneToOne ─────────────────────────────────────────────────────────────

describe("ResendAdapter.sendOneToOne", () => {
  it("sends with URL-based attachments and returns the provider id", async () => {
    const fake = createFakeClient();
    fake.emails.send.mockResolvedValue({
      data: { id: "email-1" },
      ...ok,
    });

    const adapter = makeAdapter(fake);
    const result = await adapter.sendOneToOne({
      to: "contact@example.com",
      from: "Support <support@example.com>",
      subject: "Re: Hello",
      html: "<p>Hi there</p>",
      text: "Hi there",
      replyTo: "support@example.com",
      attachments: [
        {
          filename: "report.pdf",
          contentType: "application/pdf",
          url: "https://files.test/report.pdf",
        },
      ],
    });

    expect(result).toEqual({ success: true, externalId: "email-1" });
    expect(fake.emails.send).toHaveBeenCalledWith({
      to: ["contact@example.com"],
      from: "Support <support@example.com>",
      subject: "Re: Hello",
      html: "<p>Hi there</p>",
      text: "Hi there",
      replyTo: ["support@example.com"],
      attachments: [
        {
          filename: "report.pdf",
          contentType: "application/pdf",
          path: "https://files.test/report.pdf",
        },
      ],
    });
  });

  it("omits replyTo and attachments when absent", async () => {
    const fake = createFakeClient();
    fake.emails.send.mockResolvedValue({ data: { id: "email-2" }, ...ok });

    const adapter = makeAdapter(fake);
    await adapter.sendOneToOne({
      to: "contact@example.com",
      from: "support@example.com",
      subject: "Hello",
      html: "<p>Hi</p>",
    });

    const payload = fake.emails.send.mock.calls[0][0];
    expect(payload.replyTo).toBeUndefined();
    expect(payload.attachments).toBeUndefined();
  });

  it("returns a failure result when the provider rejects the send", async () => {
    const fake = createFakeClient();
    fake.emails.send.mockResolvedValue({
      data: null,
      error: { message: "domain not verified", name: "validation_error" },
    });

    const adapter = makeAdapter(fake);
    const result = await adapter.sendOneToOne({
      to: "contact@example.com",
      from: "support@example.com",
      subject: "Hello",
      html: "<p>Hi</p>",
    });

    expect(result).toEqual({ success: false, error: "domain not verified" });
  });

  it("returns a failure result when the client throws", async () => {
    const fake = createFakeClient();
    fake.emails.send.mockRejectedValue(new Error("network down"));

    const adapter = makeAdapter(fake);
    const result = await adapter.sendOneToOne({
      to: "contact@example.com",
      from: "support@example.com",
      subject: "Hello",
      html: "<p>Hi</p>",
    });

    expect(result).toEqual({ success: false, error: "network down" });
  });
});

// ─── Inbound (receiving) ─────────────────────────────────────────────────────

describe("ResendAdapter.verifyWebhook", () => {
  it("delegates to the Resend webhook verifier with the raw inputs", () => {
    const fake = createFakeClient();
    const event = {
      type: "email.received",
      data: { email_id: "inbound-1" },
    };
    fake.webhooks.verify.mockReturnValue(event);

    const adapter = makeAdapter(fake);
    const result = adapter.verifyWebhook({
      payload: "{\"type\":\"email.received\"}",
      headers: { id: "msg_1", timestamp: "123", signature: "v1,abc" },
      webhookSecret: "whsec_test",
    });

    expect(result).toBe(event);
    expect(fake.webhooks.verify).toHaveBeenCalledWith({
      payload: "{\"type\":\"email.received\"}",
      headers: { id: "msg_1", timestamp: "123", signature: "v1,abc" },
      webhookSecret: "whsec_test",
    });
  });
});

describe("ResendAdapter.fetchInbound", () => {
  it("maps the received email body and attachment metadata", async () => {
    const fake = createFakeClient();
    fake.emails.receiving.get.mockResolvedValue({
      data: {
        object: "email",
        id: "inbound-1",
        to: ["support@example.com"],
        from: "Alice <alice@example.com>",
        created_at: "2026-10-17T10:00:00.000Z",
        subject: "Hello",
        bcc: null,
        cc: ["cc@example.com"],
        reply_to: null,
        received_for: ["support@example.com"],
        html: "<p>Hi</p>",
        text: "Hi",
        headers: {
          "In-Reply-To": "<parent@example.com>",
          References: "<root@example.com> <parent@example.com>",
        },
        message_id: "<msg-1@example.com>",
        raw: null,
        attachments: [
          {
            id: "att-1",
            filename: "report.pdf",
            size: 1234,
            content_type: "application/pdf",
            content_id: null,
            content_disposition: "attachment",
          },
        ],
      },
      ...ok,
    });

    const adapter = makeAdapter(fake);
    const inbound = await adapter.fetchInbound("inbound-1");

    expect(fake.emails.receiving.get).toHaveBeenCalledWith("inbound-1");
    expect(inbound).toMatchObject({
      externalId: "inbound-1",
      messageId: "<msg-1@example.com>",
      inReplyTo: "<parent@example.com>",
      references: ["<root@example.com>", "<parent@example.com>"],
      from: "Alice <alice@example.com>",
      to: ["support@example.com"],
      cc: ["cc@example.com"],
      bcc: [],
      subject: "Hello",
      bodyHtml: "<p>Hi</p>",
      bodyText: "Hi",
      attachments: [
        {
          externalId: "att-1",
          filename: "report.pdf",
          contentType: "application/pdf",
          size: 1234,
        },
      ],
    });
    expect(inbound.receivedAt.toISOString()).toBe("2026-10-17T10:00:00.000Z");
  });

  it("throws when the provider returns an error", async () => {
    const fake = createFakeClient();
    fake.emails.receiving.get.mockResolvedValue({
      data: null,
      error: { message: "not found", name: "not_found" },
    });

    const adapter = makeAdapter(fake);

    await expect(adapter.fetchInbound("missing")).rejects.toThrow(
      "not found",
    );
  });
});

describe("ResendAdapter.listInboundAttachments", () => {
  it("maps attachment metadata", async () => {
    const fake = createFakeClient();
    fake.emails.receiving.attachments.list.mockResolvedValue({
      data: {
        object: "list",
        has_more: false,
        data: [
          {
            id: "att-1",
            filename: "report.pdf",
            size: 1234,
            content_type: "application/pdf",
            content_disposition: "attachment",
            download_url: "https://provider.test/att-1",
            expires_at: "2026-10-17T11:00:00.000Z",
          },
          {
            id: "att-2",
            filename: null,
            size: 10,
            content_type: "text/plain",
            content_disposition: "inline",
            download_url: "https://provider.test/att-2",
            expires_at: "2026-10-17T11:00:00.000Z",
          },
        ],
      },
      ...ok,
    });

    const adapter = makeAdapter(fake);
    const attachments = await adapter.listInboundAttachments("inbound-1");

    expect(fake.emails.receiving.attachments.list).toHaveBeenCalledWith({
      emailId: "inbound-1",
    });
    expect(attachments).toEqual([
      {
        externalId: "att-1",
        filename: "report.pdf",
        contentType: "application/pdf",
        size: 1234,
      },
      {
        externalId: "att-2",
        filename: "attachment",
        contentType: "text/plain",
        size: 10,
      },
    ]);
  });
});

describe("ResendAdapter.getAttachmentDownloadUrl", () => {
  it("returns the signed URL and expiry", async () => {
    const fake = createFakeClient();
    fake.emails.receiving.attachments.get.mockResolvedValue({
      data: {
        object: "attachment",
        id: "att-1",
        filename: "report.pdf",
        size: 1234,
        content_type: "application/pdf",
        content_disposition: "attachment",
        download_url: "https://provider.test/att-1?sig=abc",
        expires_at: "2026-10-17T11:00:00.000Z",
      },
      ...ok,
    });

    const adapter = makeAdapter(fake);
    const result = await adapter.getAttachmentDownloadUrl("inbound-1", "att-1");

    expect(fake.emails.receiving.attachments.get).toHaveBeenCalledWith({
      emailId: "inbound-1",
      id: "att-1",
    });
    expect(result.url).toBe("https://provider.test/att-1?sig=abc");
    expect(result.expiresAt?.toISOString()).toBe("2026-10-17T11:00:00.000Z");
  });

  it("throws when the provider returns an error", async () => {
    const fake = createFakeClient();
    fake.emails.receiving.attachments.get.mockResolvedValue({
      data: null,
      error: { message: "expired", name: "expired" },
    });

    const adapter = makeAdapter(fake);

    await expect(
      adapter.getAttachmentDownloadUrl("inbound-1", "att-1"),
    ).rejects.toThrow("expired");
  });
});
