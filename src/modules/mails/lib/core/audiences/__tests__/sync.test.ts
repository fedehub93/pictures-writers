import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import type { EmailProviderAdapter } from "@/modules/mails/lib/types";

import { syncContactsWithProvider } from "../sync";

/**
 * Helper: create a fake adapter that records calls and returns configurable results.
 */
function createFakeAdapter(overrides: {
  syncSegment?: EmailProviderAdapter["syncSegment"];
  syncContactsBatch?: EmailProviderAdapter["syncContactsBatch"];
} = {}): EmailProviderAdapter & {
  calls: {
    syncContactsBatch: Parameters<EmailProviderAdapter["syncContactsBatch"]>[];
  };
} {
  const calls = {
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
    createContact: async () => ({ errors: [], newExternalId: "ext" }),
    deleteContact: async () => ({ errors: [] }),
    upsertContact: async () => ({ errors: [], externalId: "ext" }),
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
    audienceIds?: string[];
  } = {},
) {
  const audienceConnections = overrides.audienceIds?.length
    ? { connect: overrides.audienceIds.map((id) => ({ id })) }
    : undefined;

  const contact = await db.emailContact.create({
    data: {
      email,
      firstName: null,
      lastName: null,
      isSubscriber: true,
      externalId: undefined,
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
