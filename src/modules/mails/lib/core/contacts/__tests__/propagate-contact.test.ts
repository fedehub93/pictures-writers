import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import type { EmailProviderAdapter } from "@/modules/mails/lib/types";

import {
  propagateContactCreate,
  propagateContactUpdate,
} from "../propagate";

/**
 * Helper: create a fake adapter that records calls and returns configurable results.
 */
function createFakeAdapter(overrides: {
  upsertContact?: EmailProviderAdapter["upsertContact"];
  createContact?: EmailProviderAdapter["createContact"];
  syncSegment?: EmailProviderAdapter["syncSegment"];
  deleteContact?: EmailProviderAdapter["deleteContact"];
} = {}): EmailProviderAdapter & {
  calls: {
    upsertContact: Parameters<EmailProviderAdapter["upsertContact"]>[];
    createContact: Parameters<EmailProviderAdapter["createContact"]>[];
    syncSegment: Parameters<EmailProviderAdapter["syncSegment"]>[];
    deleteContact: Parameters<EmailProviderAdapter["deleteContact"]>[];
  };
} {
  const calls = {
    upsertContact: [] as Parameters<EmailProviderAdapter["upsertContact"]>[],
    createContact: [] as Parameters<EmailProviderAdapter["createContact"]>[],
    syncSegment: [] as Parameters<EmailProviderAdapter["syncSegment"]>[],
    deleteContact: [] as Parameters<EmailProviderAdapter["deleteContact"]>[],
  };

  return {
    calls,
    syncSegment:
      overrides.syncSegment ??
      (async (...args) => {
        calls.syncSegment.push(args);
        return { errors: [], newExternalId: `seg-${randomUUID()}` };
      }),
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
    deleteContact:
      overrides.deleteContact ??
      (async (...args) => {
        calls.deleteContact.push(args);
        return { errors: [] };
      }),
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

// ─── propagateContactCreate ─────────────────────────────────────────────────

describe("propagateContactCreate", () => {
  it("calls upsertContact with correct contact data", async () => {
    const audience = await createAudience("Synced", "aud-ext-1");
    const contact = await createContact("new@test.com", {
      firstName: "John",
      lastName: "Doe",
      isSubscriber: true,
      audienceIds: [audience.id],
    });

    const adapter = createFakeAdapter();
    const result = await propagateContactCreate(contact.id, adapter);

    expect(result.propagationWarning).toBeUndefined();
    expect(adapter.calls.upsertContact).toHaveLength(1);

    const [email, id, firstName, lastName, isSubscriber, audiences] =
      adapter.calls.upsertContact[0];
    expect(email).toBe("new@test.com");
    expect(id).toBe(contact.id);
    expect(firstName).toBe("John");
    expect(lastName).toBe("Doe");
    expect(isSubscriber).toBe(true);
    expect(audiences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ externalId: "aud-ext-1" }),
      ]),
    );
  });

  it("syncs audiences that lack externalId before upserting", async () => {
    const audienceNoExt = await db.emailAudience.create({
      data: { name: "No External" },
    });
    createdAudienceIds.push(audienceNoExt.id);

    const contact = await createContact("sync-aud@test.com", {
      audienceIds: [audienceNoExt.id],
    });

    const adapter = createFakeAdapter({
      syncSegment: async (...args) => {
        adapter.calls.syncSegment.push(args);
        return { errors: [], newExternalId: "new-seg-id" };
      },
    });

    await propagateContactCreate(contact.id, adapter);

    // syncSegment should have been called for the audience without externalId
    expect(adapter.calls.syncSegment).toHaveLength(1);
    expect(adapter.calls.syncSegment[0]).toEqual([null, "No External"]);

    // The audience should now have the externalId persisted
    const updatedAudience = await db.emailAudience.findUnique({
      where: { id: audienceNoExt.id },
    });
    expect(updatedAudience?.externalId).toBe("new-seg-id");

    // upsertContact should receive the freshly synced audience
    const audiencesArg = adapter.calls.upsertContact[0]?.[5];
    expect(audiencesArg).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ externalId: "new-seg-id" }),
      ]),
    );
  });

  it("persists the returned externalId in the DB", async () => {
    const audience = await createAudience("Synced", "aud-ext-1");
    const contact = await createContact("persist@test.com", {
      audienceIds: [audience.id],
    });

    const adapter = createFakeAdapter({
      upsertContact: async (...args) => {
        adapter.calls.upsertContact.push(args);
        return { errors: [], externalId: "created-ext-id" };
      },
    });

    await propagateContactCreate(contact.id, adapter);

    const updated = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(updated?.externalId).toBe("created-ext-id");
  });

  it("returns propagationWarning when upsertContact fails", async () => {
    const contact = await createContact("fail@test.com");

    const adapter = createFakeAdapter({
      upsertContact: async () => ({
        errors: ["Provider unavailable"],
        externalId: "",
      }),
    });

    const result = await propagateContactCreate(contact.id, adapter);

    expect(result.propagationWarning).toBe("Provider error: Provider unavailable");
    // Contact should still exist in DB (local operation succeeded)
    const stillExists = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(stillExists).not.toBeNull();
  });

  it("returns propagationWarning on unexpected error without throwing", async () => {
    const contact = await createContact("crash@test.com");

    const adapter = createFakeAdapter({
      upsertContact: async () => {
        throw new Error("Network timeout");
      },
    });

    const result = await propagateContactCreate(contact.id, adapter);

    expect(result.propagationWarning).toBe("Network timeout");
    // Contact should still exist
    const stillExists = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(stillExists).not.toBeNull();
  });
});

// ─── propagateContactUpdate ─────────────────────────────────────────────────

describe("propagateContactUpdate", () => {
  it("calls upsertContact with updated contact data", async () => {
    const audience = await createAudience("Synced", "aud-ext-1");
    const contact = await createContact("update@test.com", {
      firstName: "Jane",
      lastName: "Smith",
      isSubscriber: false,
      audienceIds: [audience.id],
    });

    const adapter = createFakeAdapter();
    const result = await propagateContactUpdate(contact.id, adapter);

    expect(result.propagationWarning).toBeUndefined();
    expect(adapter.calls.upsertContact).toHaveLength(1);

    const [email, id, firstName, lastName, isSubscriber, audiences] =
      adapter.calls.upsertContact[0];
    expect(email).toBe("update@test.com");
    expect(id).toBe(contact.id);
    expect(firstName).toBe("Jane");
    expect(lastName).toBe("Smith");
    expect(isSubscriber).toBe(false);
    expect(audiences).toEqual([{ externalId: "aud-ext-1" }]);
  });

  it("only passes audiences with externalId", async () => {
    const audienceWithExt = await createAudience("With", "aud-with");
    const audienceWithoutExt = await db.emailAudience.create({
      data: { name: "Without" },
    });
    createdAudienceIds.push(audienceWithoutExt.id);

    const contact = await createContact("mixed@test.com", {
      audienceIds: [audienceWithExt.id, audienceWithoutExt.id],
    });

    const adapter = createFakeAdapter();
    await propagateContactUpdate(contact.id, adapter);

    const audiencesArg = adapter.calls.upsertContact[0]?.[5];
    expect(audiencesArg).toHaveLength(1);
    expect(audiencesArg?.[0]?.externalId).toBe("aud-with");
  });

  it("returns propagationWarning when upsertContact fails", async () => {
    const contact = await createContact("fail-update@test.com");

    const adapter = createFakeAdapter({
      upsertContact: async () => ({
        errors: ["Rate limit exceeded"],
        externalId: "",
      }),
    });

    const result = await propagateContactUpdate(contact.id, adapter);

    expect(result.propagationWarning).toBe(
      "Provider error: Rate limit exceeded",
    );
    // Contact should still exist in DB
    const stillExists = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(stillExists).not.toBeNull();
  });

  it("returns propagationWarning on unexpected error without throwing", async () => {
    const contact = await createContact("crash-update@test.com");

    const adapter = createFakeAdapter({
      upsertContact: async () => {
        throw new Error("Connection refused");
      },
    });

    const result = await propagateContactUpdate(contact.id, adapter);

    expect(result.propagationWarning).toBe("Connection refused");
  });
});
