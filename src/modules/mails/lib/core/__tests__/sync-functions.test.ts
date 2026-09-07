import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { db } from "@/shared/lib/db";
import type { EmailProviderAdapter } from "@/modules/mails/lib/types";

import {
  syncContactsWithProvider,
  syncContactWithProvider,
  createContactOnProvider,
} from "../index";

/**
 * Helper: create a fake adapter that records calls and returns configurable results.
 */
function createFakeAdapter(overrides: {
  upsertContact?: EmailProviderAdapter["upsertContact"];
  createContact?: EmailProviderAdapter["createContact"];
  syncContactsBatch?: EmailProviderAdapter["syncContactsBatch"];
  syncSegment?: EmailProviderAdapter["syncSegment"];
} = {}): EmailProviderAdapter & {
  calls: {
    upsertContact: Parameters<EmailProviderAdapter["upsertContact"]>[];
    createContact: Parameters<EmailProviderAdapter["createContact"]>[];
    syncContactsBatch: Parameters<EmailProviderAdapter["syncContactsBatch"]>[];
  };
} {
  const calls = {
    upsertContact: [] as Parameters<EmailProviderAdapter["upsertContact"]>[],
    createContact: [] as Parameters<EmailProviderAdapter["createContact"]>[],
    syncContactsBatch:
      [] as Parameters<EmailProviderAdapter["syncContactsBatch"]>[],
  };

  return {
    calls,
    syncSegment:
      overrides.syncSegment ??
      (async () => ({ errors: [] })),
    syncContactsBatch:
      overrides.syncContactsBatch ??
      (async (contacts) => {
        calls.syncContactsBatch.push([contacts]);
        return {
          success: true,
          totalProcessed: contacts.length,
          successfulCount: contacts.length,
          failedCount: 0,
          errors: [],
          syncedContacts: contacts.map((c) => ({
            localId: c.id,
            externalId: `ext-${c.id}`,
          })),
        };
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

// ─── syncContactsWithProvider ────────────────────────────────────────────────

describe("syncContactsWithProvider", () => {
  it("returns success with zero counts when no contacts are found", async () => {
    const audience = await createAudience();
    // No contacts in this audience

    const adapter = createFakeAdapter();
    const result = await syncContactsWithProvider(
      { skip: 0, take: 100, audienceId: audience.id },
      adapter,
    );

    expect(result.success).toBe(true);
    expect(result.totalProcessed).toBe(0);
    expect(result.successfulCount).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.syncedContacts).toEqual([]);
  });

  it("persists externalId for each synced contact via DB transaction", async () => {
    const audience = await createAudience();
    const contact1 = await createContact("a@test.com", {
      audienceIds: [audience.id],
    });
    const contact2 = await createContact("b@test.com", {
      audienceIds: [audience.id],
    });

    // Both contacts start without externalId
    expect(
      (await db.emailContact.findUnique({ where: { id: contact1.id } }))
        ?.externalId,
    ).toBeNull();
    expect(
      (await db.emailContact.findUnique({ where: { id: contact2.id } }))
        ?.externalId,
    ).toBeNull();

    const adapter = createFakeAdapter({
      syncContactsBatch: async (contacts) => {
        return {
          success: true,
          totalProcessed: contacts.length,
          successfulCount: contacts.length,
          failedCount: 0,
          errors: [],
          syncedContacts: [
            { localId: contact1.id, externalId: "resend-id-1" },
            { localId: contact2.id, externalId: "resend-id-2" },
          ],
        };
      },
    });

    const result = await syncContactsWithProvider(
      { skip: 0, take: 100, audienceId: audience.id },
      adapter,
    );

    expect(result.success).toBe(true);
    expect(result.syncedContacts).toHaveLength(2);

    // Verify externalIds were persisted in the DB
    const updatedContact1 = await db.emailContact.findUnique({
      where: { id: contact1.id },
    });
    const updatedContact2 = await db.emailContact.findUnique({
      where: { id: contact2.id },
    });

    expect(updatedContact1?.externalId).toBe("resend-id-1");
    expect(updatedContact2?.externalId).toBe("resend-id-2");
  });

  it("does not update contacts that failed to sync", async () => {
    const audience = await createAudience();
    const contact1 = await createContact("ok@test.com", {
      audienceIds: [audience.id],
    });
    const contact2 = await createContact("fail@test.com", {
      audienceIds: [audience.id],
    });

    const adapter = createFakeAdapter({
      syncContactsBatch: async () => ({
        success: false,
        totalProcessed: 2,
        successfulCount: 1,
        failedCount: 1,
        errors: [{ email: "fail@test.com", reason: "Invalid email" }],
        // Only contact1 was synced successfully
        syncedContacts: [{ localId: contact1.id, externalId: "resend-ok" }],
      }),
    });

    await syncContactsWithProvider(
      { skip: 0, take: 100, audienceId: audience.id },
      adapter,
    );

    // contact1 should have externalId
    const updated1 = await db.emailContact.findUnique({
      where: { id: contact1.id },
    });
    expect(updated1?.externalId).toBe("resend-ok");

    // contact2 should still have no externalId
    const updated2 = await db.emailContact.findUnique({
      where: { id: contact2.id },
    });
    expect(updated2?.externalId).toBeNull();
  });
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
