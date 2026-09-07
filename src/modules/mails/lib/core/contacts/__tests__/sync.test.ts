import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import type { EmailProviderAdapter } from "@/modules/mails/lib/types";

import { syncContactWithProvider, createContactOnProvider } from "../sync";

/**
 * Helper: create a fake adapter that records calls and returns configurable results.
 */
function createFakeAdapter(overrides: {
  upsertContact?: EmailProviderAdapter["upsertContact"];
  createContact?: EmailProviderAdapter["createContact"];
} = {}): EmailProviderAdapter & {
  calls: {
    upsertContact: Parameters<EmailProviderAdapter["upsertContact"]>[];
    createContact: Parameters<EmailProviderAdapter["createContact"]>[];
  };
} {
  const calls = {
    upsertContact: [] as Parameters<EmailProviderAdapter["upsertContact"]>[],
    createContact: [] as Parameters<EmailProviderAdapter["createContact"]>[],
  };

  return {
    calls,
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
    createContact:
      overrides.createContact ??
      (async (...args) => {
        calls.createContact.push(args);
        return { errors: [], newExternalId: `ext-${args[1]}` };
      }),
    deleteContact: async () => ({ errors: [] }),
    upsertContact:
      overrides.upsertContact ??
      (async (...args) => {
        calls.upsertContact.push(args);
        return { errors: [], externalId: `ext-${args[1]}` };
      }),
    deleteSegment: async () => ({ errors: [] }),
    sendBulk: async () => ({ success: true }),
  };
}

// ─── Shared cleanup ─────────────────────────────────────────────────────────

const createdContactIds: string[] = [];
const createdAudienceIds: string[] = [];

async function createAudience(name = "Test Audience", externalId?: string) {
  const audience = await db.emailAudience.create({
    data: {
      name,
      externalId: externalId ?? `aud-${randomUUID()}`,
    },
  });
  createdAudienceIds.push(audience.id);
  return audience;
}

async function createContact(
  email: string,
  overrides: {
    externalId?: string | null;
    audienceIds?: string[];
    firstName?: string;
    lastName?: string;
    isSubscriber?: boolean;
  } = {},
) {
  const audienceConnections = overrides.audienceIds?.length
    ? { connect: overrides.audienceIds.map((id) => ({ id })) }
    : undefined;

  const contact = await db.emailContact.create({
    data: {
      email,
      firstName: overrides.firstName ?? null,
      lastName: overrides.lastName ?? null,
      isSubscriber: overrides.isSubscriber ?? true,
      externalId: overrides.externalId ?? undefined,
      audiences: audienceConnections,
    },
  });
  createdContactIds.push(contact.id);
  return contact;
}

beforeEach(async () => {
  await db.emailContact.deleteMany({});
  await db.emailAudience.deleteMany({});
  createdContactIds.length = 0;
  createdAudienceIds.length = 0;
});

afterEach(async () => {
  if (createdContactIds.length > 0) {
    await db.emailContact.deleteMany({
      where: { id: { in: createdContactIds } },
    });
  }
  if (createdAudienceIds.length > 0) {
    await db.emailAudience.deleteMany({
      where: { id: { in: createdAudienceIds } },
    });
  }
  createdContactIds.length = 0;
  createdAudienceIds.length = 0;
});

// ─── syncContactWithProvider ─────────────────────────────────────────────────

describe("syncContactWithProvider", () => {
  it("calls upsertContact instead of createContact", async () => {
    const audience = await createAudience();
    const contact = await createContact("test@test.com", {
      audienceIds: [audience.id],
    });

    const adapter = createFakeAdapter();
    await syncContactWithProvider(contact.id, adapter);

    // upsertContact should have been called
    expect(adapter.calls.upsertContact).toHaveLength(1);
    // createContact should NOT have been called
    expect(adapter.calls.createContact).toHaveLength(0);
  });

  it("passes audiences with non-null externalId to upsertContact", async () => {
    const audienceWithExt = await createAudience("With External", "aud-ext-1");
    const audienceWithoutExt = await db.emailAudience.create({
      data: { name: "Without External" }, // no externalId
    });
    createdAudienceIds.push(audienceWithoutExt.id);

    const contact = await createContact("test@test.com", {
      audienceIds: [audienceWithExt.id, audienceWithoutExt.id],
    });

    const adapter = createFakeAdapter();
    await syncContactWithProvider(contact.id, adapter);

    const upsertCallArgs = adapter.calls.upsertContact[0];
    const audiencesArg = upsertCallArgs[5]; // 6th parameter

    // Only the audience with externalId should be passed
    expect(audiencesArg).toHaveLength(1);
    expect(audiencesArg?.[0]?.externalId).toBe("aud-ext-1");
  });

  it("saves the returned externalId if the contact did not have one", async () => {
    const contact = await createContact("new@test.com");

    // Contact starts without externalId
    expect(
      (await db.emailContact.findUnique({ where: { id: contact.id } }))
        ?.externalId,
    ).toBeNull();

    const adapter = createFakeAdapter({
      upsertContact: async (...args) => {
        adapter.calls.upsertContact.push(args);
        return { errors: [], externalId: "new-resend-id" };
      },
    });

    const result = await syncContactWithProvider(contact.id, adapter);

    expect(result.externalId).toBe("new-resend-id");

    // Verify it was persisted
    const updated = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(updated?.externalId).toBe("new-resend-id");
  });

  it("does not overwrite existing externalId", async () => {
    const contact = await createContact("existing@test.com", {
      externalId: "existing-resend-id",
    });

    const adapter = createFakeAdapter({
      upsertContact: async (...args) => {
        adapter.calls.upsertContact.push(args);
        return { errors: [], externalId: "different-resend-id" };
      },
    });

    await syncContactWithProvider(contact.id, adapter);

    // The DB should still have the original externalId
    const updated = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(updated?.externalId).toBe("existing-resend-id");
  });

  it("throws when upsertContact returns errors", async () => {
    const contact = await createContact("error@test.com");

    const adapter = createFakeAdapter({
      upsertContact: async () => ({
        errors: ["Provider unavailable"],
        externalId: "",
      }),
    });

    await expect(syncContactWithProvider(contact.id, adapter)).rejects.toThrow(
      "Contact not synced: Provider unavailable",
    );
  });
});

// ─── createContactOnProvider ─────────────────────────────────────────────────

describe("createContactOnProvider", () => {
  it("loads and passes audiences with non-null externalId to createContact", async () => {
    const audienceWithExt = await createAudience("Synced", "aud-synced-1");
    const audienceWithoutExt = await db.emailAudience.create({
      data: { name: "Not Synced" },
    });
    createdAudienceIds.push(audienceWithoutExt.id);

    const contact = await createContact("create@test.com", {
      audienceIds: [audienceWithExt.id, audienceWithoutExt.id],
    });

    const adapter = createFakeAdapter();
    await createContactOnProvider(contact.id, adapter);

    expect(adapter.calls.createContact).toHaveLength(1);
    const createCallArgs = adapter.calls.createContact[0];
    const audiencesArg = createCallArgs[5]; // 6th parameter

    // Only the audience with externalId should be passed
    expect(audiencesArg).toHaveLength(1);
    expect(audiencesArg?.[0]?.externalId).toBe("aud-synced-1");
  });

  it("persists the returned externalId in the DB", async () => {
    const audience = await createAudience();
    const contact = await createContact("persist@test.com", {
      audienceIds: [audience.id],
    });

    const adapter = createFakeAdapter({
      createContact: async (...args) => {
        adapter.calls.createContact.push(args);
        return { errors: [], newExternalId: "created-resend-id" };
      },
    });

    const result = await createContactOnProvider(contact.id, adapter);

    expect(result).toBe("created-resend-id");

    const updated = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(updated?.externalId).toBe("created-resend-id");
  });

  it("throws when createContact fails", async () => {
    const contact = await createContact("fail-create@test.com");

    const adapter = createFakeAdapter({
      createContact: async () => ({
        errors: [],
        newExternalId: undefined,
      }),
    });

    await expect(
      createContactOnProvider(contact.id, adapter),
    ).rejects.toThrow("Contact not created");
  });

  it("passes empty audiences array when no audiences have externalId", async () => {
    const audienceNoExt = await db.emailAudience.create({
      data: { name: "No External" },
    });
    createdAudienceIds.push(audienceNoExt.id);

    const contact = await createContact("no-aud-ext@test.com", {
      audienceIds: [audienceNoExt.id],
    });

    const adapter = createFakeAdapter();
    await createContactOnProvider(contact.id, adapter);

    const createCallArgs = adapter.calls.createContact[0];
    const audiencesArg = createCallArgs[5];

    expect(audiencesArg).toEqual([]);
  });
});
