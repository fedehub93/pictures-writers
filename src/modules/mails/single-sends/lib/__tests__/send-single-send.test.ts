import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import type { EmailProviderAdapter } from "@/modules/mails/lib/types";

import {
  sendSingleSend,
  EmailSendError,
} from "../send-single-send";

describe("sendSingleSend", () => {
  const createdSingleSendIds: string[] = [];
  const createdAudienceIds: string[] = [];

  const fakeAdapter = (
    behavior: "success" | "permanent-failure" | "transient-failure" = "success",
  ): EmailProviderAdapter => {
    return {
      syncSegment: async () => ({ errors: [] }),
      syncContactsBatch: async () => ({
        success: true,
        totalProcessed: 0,
        successfulCount: 0,
        failedCount: 0,
        errors: [],
      }),
      createContact: async () => ({ errors: [] }),
      deleteContact: async () => ({ errors: [] }),
      sendBulk: async ({ segmentExternalId }) => {
        if (behavior === "permanent-failure") {
          return {
            success: false,
            error: "Invalid segment",
          };
        }
        if (behavior === "transient-failure") {
          return {
            success: false,
            error: "Provider timeout",
          };
        }
        return {
          success: true,
          externalCampaignId: `campaign-${segmentExternalId}`,
        };
      },
    };
  };

  const createAudience = async (name = "Test Audience") => {
    const audience = await db.emailAudience.create({
      data: {
        name,
        externalId: `aud-${randomUUID()}`,
      },
    });
    createdAudienceIds.push(audience.id);
    return audience;
  };

  const createSingleSend = async (overrides: {
    subject?: string;
    bodyHtml?: string;
    audienceIds?: string[];
  } = {}) => {
    const audienceConnections = overrides.audienceIds?.length
      ? { connect: overrides.audienceIds.map((id) => ({ id })) }
      : undefined;

    const singleSend = await db.emailSingleSend.create({
      data: {
        name: "Test Newsletter",
        subject: overrides.subject ?? "Subject",
        bodyHtml: overrides.bodyHtml ?? "<p>Body</p>",
        audiences: audienceConnections,
      },
      include: { audiences: true },
    });
    createdSingleSendIds.push(singleSend.id);
    return singleSend;
  };

  beforeEach(async () => {
    await db.emailSingleSend.deleteMany({});
    await db.emailAudience.deleteMany({});
    createdSingleSendIds.length = 0;
    createdAudienceIds.length = 0;
  });

  afterEach(async () => {
    if (createdSingleSendIds.length > 0) {
      await db.emailSingleSend.deleteMany({
        where: { id: { in: createdSingleSendIds } },
      });
    }
    if (createdAudienceIds.length > 0) {
      await db.emailAudience.deleteMany({
        where: { id: { in: createdAudienceIds } },
      });
    }
    createdSingleSendIds.length = 0;
    createdAudienceIds.length = 0;
  });

  it("sends using the latest subject and body", async () => {
    const audience = await createAudience();
    const singleSend = await createSingleSend({
      subject: "Original",
      bodyHtml: "<p>Original</p>",
      audienceIds: [audience.id],
    });

    await db.emailSingleSend.update({
      where: { id: singleSend.id },
      data: { subject: "Updated", bodyHtml: "<p>Updated</p>" },
    });

    const adapter = fakeAdapter();
    const result = await sendSingleSend({
      singleSendId: singleSend.id,
      adapter,
      from: "Test <test@example.com>",
    });

    expect(result.providerId).toBe(`campaign-${audience.externalId}`);
  });

  it("resolves audiences dynamically at execution time", async () => {
    const audience = await createAudience("Initial");
    const singleSend = await createSingleSend({
      audienceIds: [audience.id],
    });

    const newAudience = await createAudience("New");
    await db.emailSingleSend.update({
      where: { id: singleSend.id },
      data: {
        audiences: {
          set: [{ id: newAudience.id }],
        },
      },
    });

    const adapter = fakeAdapter();
    const result = await sendSingleSend({
      singleSendId: singleSend.id,
      adapter,
      from: "Test <test@example.com>",
    });

    expect(result.providerId).toBe(`campaign-${newAudience.externalId}`);
  });

  it("handles multiple audiences explicitly", async () => {
    const audienceA = await createAudience("A");
    const audienceB = await createAudience("B");
    const singleSend = await createSingleSend({
      audienceIds: [audienceA.id, audienceB.id],
    });

    const adapter = fakeAdapter();
    const result = await sendSingleSend({
      singleSendId: singleSend.id,
      adapter,
      from: "Test <test@example.com>",
    });

    expect(result.providerId).toBe(
      `campaign-${audienceA.externalId},campaign-${audienceB.externalId}`,
    );
  });

  it("does not call the provider when the single send is missing subject", async () => {
    const audience = await createAudience();
    const singleSend = await createSingleSend({
      subject: "",
      audienceIds: [audience.id],
    });

    await expect(
      sendSingleSend({
        singleSendId: singleSend.id,
        adapter: fakeAdapter(),
        from: "Test <test@example.com>",
      }),
    ).rejects.toBeInstanceOf(EmailSendError);
  });

  it("does not call the provider when no audience is selected", async () => {
    const singleSend = await createSingleSend();

    await expect(
      sendSingleSend({
        singleSendId: singleSend.id,
        adapter: fakeAdapter(),
        from: "Test <test@example.com>",
      }),
    ).rejects.toBeInstanceOf(EmailSendError);
  });

  it("does not call the provider when the audience is not synchronized", async () => {
    const audience = await db.emailAudience.create({
      data: { name: "Unsynced" },
    });
    createdAudienceIds.push(audience.id);
    const singleSend = await createSingleSend({
      audienceIds: [audience.id],
    });

    await expect(
      sendSingleSend({
        singleSendId: singleSend.id,
        adapter: fakeAdapter(),
        from: "Test <test@example.com>",
      }),
    ).rejects.toBeInstanceOf(EmailSendError);
  });

  it("classifies transient provider errors as retryable", async () => {
    const audience = await createAudience();
    const singleSend = await createSingleSend({
      audienceIds: [audience.id],
    });

    await expect(
      sendSingleSend({
        singleSendId: singleSend.id,
        adapter: fakeAdapter("transient-failure"),
        from: "Test <test@example.com>",
      }),
    ).rejects.toSatisfy((error: EmailSendError) => error.transient === true);
  });

  it("classifies permanent provider errors as non-retryable", async () => {
    const audience = await createAudience();
    const singleSend = await createSingleSend({
      audienceIds: [audience.id],
    });

    await expect(
      sendSingleSend({
        singleSendId: singleSend.id,
        adapter: fakeAdapter("permanent-failure"),
        from: "Test <test@example.com>",
      }),
    ).rejects.toSatisfy((error: EmailSendError) => error.transient === false);
  });
});
