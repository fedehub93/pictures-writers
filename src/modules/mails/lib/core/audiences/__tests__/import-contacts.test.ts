import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import type { EmailProviderAdapter } from "@/modules/mails/lib/types";

import { importContactsIntoAudience } from "../sync";

/**
 * Helper: create a fake adapter that records `addContactsToSegment` calls and
 * returns configurable results.
 */
function createFakeAdapter(overrides: {
  syncSegment?: EmailProviderAdapter["syncSegment"];
  addContactsToSegment?: EmailProviderAdapter["addContactsToSegment"];
} = {}): EmailProviderAdapter & {
  calls: {
    addContactsToSegment: Parameters<
      EmailProviderAdapter["addContactsToSegment"]
    >[];
  };
} {
  const calls = {
    addContactsToSegment:
      [] as Parameters<EmailProviderAdapter["addContactsToSegment"]>[],
  };

  return {
    calls,
    syncSegment:
      overrides.syncSegment ?? (async () => ({ errors: [] })),
    syncContactsBatch: async () => ({
      success: true,
      totalProcessed: 0,
      successfulCount: 0,
      failedCount: 0,
      errors: [],
      syncedContacts: [],
    }),
    addContactsToSegment:
      overrides.addContactsToSegment ??
      (async (contacts, segmentExternalId) => {
        calls.addContactsToSegment.push([contacts, segmentExternalId]);
        return {
          success: true,
          totalProcessed: contacts.length,
          successfulCount: contacts.length,
          failedCount: 0,
          errors: [],
          // Only newly created contacts (no externalId yet) get a provider id
          syncedContacts: contacts
            .filter((c) => !c.externalId)
            .map((c) => ({ localId: c.id, externalId: `ext-${c.id}` })),
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
    externalId?: string | null;
    interactionType?: string;
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
      externalId: overrides.externalId ?? undefined,
      audiences: audienceConnections,
    },
  });
  createdContactIds.push(contact.id);

  if (overrides.interactionType) {
    await db.emailContactInteraction.create({
      data: {
        contactId: contact.id,
        interactionType: overrides.interactionType,
      },
    });
  }

  return contact;
}

beforeEach(async () => {
  await db.emailContactInteraction.deleteMany({});
  await db.emailContact.deleteMany({});
  await db.emailAudience.deleteMany({});
  createdContactIds.length = 0;
  createdAudienceIds.length = 0;
});

afterEach(async () => {
  if (createdContactIds.length > 0) {
    await db.emailContactInteraction.deleteMany({
      where: { contactId: { in: createdContactIds } },
    });
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

// ─── importContactsIntoAudience ─────────────────────────────────────────────

describe("importContactsIntoAudience", () => {
  it("imports only contacts missing from the audience with matching interactions", async () => {
    const audience = await createAudience();
    const inAudience = await createContact("in@test.com", {
      audienceIds: [audience.id],
      interactionType: "ebook_downloaded",
    });
    const missing = await createContact("missing@test.com", {
      interactionType: "ebook_downloaded",
    });
    await createContact("wrong@test.com", {
      interactionType: "user_subscribed",
    });
    const alreadyExternal = await createContact("external@test.com", {
      externalId: "ext-1",
      interactionType: "ebook_downloaded",
    });

    const adapter = createFakeAdapter();
    const result = await importContactsIntoAudience(
      audience.id,
      ["ebook_downloaded"],
      0,
      100,
      adapter,
    );

    // Only the delta (missing + alreadyExternal) reached the provider
    expect(adapter.calls.addContactsToSegment).toHaveLength(1);
    const [contacts, segmentId] = adapter.calls.addContactsToSegment[0];
    expect(contacts.map((c) => c.email).sort()).toEqual([
      "external@test.com",
      "missing@test.com",
    ]);
    expect(segmentId).toBe(audience.externalId);

    // Local connection happened for the delta
    const linked = await db.emailContact.findMany({
      where: { audiences: { some: { id: audience.id } } },
      select: { id: true },
    });
    expect(linked.map((c) => c.id).sort()).toEqual(
      [missing.id, alreadyExternal.id, inAudience.id].sort(),
    );

    expect(result.success).toBe(true);
  });

  it("returns a graceful zero-result and makes no provider call for an empty delta", async () => {
    const audience = await createAudience();
    // Contact already in the audience → not part of the delta
    await createContact("in@test.com", {
      audienceIds: [audience.id],
      interactionType: "ebook_downloaded",
    });

    const adapter = createFakeAdapter();
    const result = await importContactsIntoAudience(
      audience.id,
      ["ebook_downloaded"],
      0,
      100,
      adapter,
    );

    expect(adapter.calls.addContactsToSegment).toHaveLength(0);
    expect(result).toEqual({
      success: true,
      totalProcessed: 0,
      successfulCount: 0,
      failedCount: 0,
      errors: [],
      syncedContacts: [],
    });
  });

  it("persists externalId for contacts created on the provider", async () => {
    const audience = await createAudience();
    const contact = await createContact("new@test.com", {
      interactionType: "ebook_downloaded",
    });
    expect(
      (await db.emailContact.findUnique({ where: { id: contact.id } }))
        ?.externalId,
    ).toBeNull();

    const adapter = createFakeAdapter({
      addContactsToSegment: async () => ({
        success: true,
        totalProcessed: 1,
        successfulCount: 1,
        failedCount: 0,
        errors: [],
        syncedContacts: [{ localId: contact.id, externalId: "resend-new-id" }],
      }),
    });

    await importContactsIntoAudience(
      audience.id,
      ["ebook_downloaded"],
      0,
      100,
      adapter,
    );

    const updated = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(updated?.externalId).toBe("resend-new-id");
  });

  it("aggregates per-contact errors without aborting and persists only successful externalIds", async () => {
    const audience = await createAudience();
    const ok = await createContact("ok@test.com", {
      interactionType: "ebook_downloaded",
    });
    const fail = await createContact("fail@test.com", {
      interactionType: "ebook_downloaded",
    });

    const adapter = createFakeAdapter({
      addContactsToSegment: async () => ({
        success: false,
        totalProcessed: 2,
        successfulCount: 1,
        failedCount: 1,
        errors: [{ email: "fail@test.com", reason: "invalid email" }],
        syncedContacts: [{ localId: ok.id, externalId: "resend-ok" }],
      }),
    });

    const result = await importContactsIntoAudience(
      audience.id,
      ["ebook_downloaded"],
      0,
      100,
      adapter,
    );

    expect(result.failedCount).toBe(1);
    expect(result.errors).toEqual([
      { email: "fail@test.com", reason: "invalid email" },
    ]);

    // Both were still connected locally despite the partial failure
    const linked = await db.emailContact.count({
      where: { audiences: { some: { id: audience.id } } },
    });
    expect(linked).toBe(2);

    // Only the successful contact got its externalId persisted
    expect(
      (await db.emailContact.findUnique({ where: { id: ok.id } }))?.externalId,
    ).toBe("resend-ok");
    expect(
      (await db.emailContact.findUnique({ where: { id: fail.id } }))
        ?.externalId,
    ).toBeNull();
  });

  it("connects contacts locally before calling the provider", async () => {
    const audience = await createAudience();
    await createContact("a@test.com", {
      interactionType: "ebook_downloaded",
    });

    let dbStateDuringCall: number | null = null;
    const adapter = createFakeAdapter({
      addContactsToSegment: async () => {
        dbStateDuringCall = await db.emailContact.count({
          where: { audiences: { some: { id: audience.id } } },
        });
        return {
          success: true,
          totalProcessed: 1,
          successfulCount: 1,
          failedCount: 0,
          errors: [],
          syncedContacts: [],
        };
      },
    });

    await importContactsIntoAudience(
      audience.id,
      ["ebook_downloaded"],
      0,
      100,
      adapter,
    );

    expect(dbStateDuringCall).toBe(1);
  });
});
