import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import type { EmailProviderAdapter } from "@/modules/mails/lib/types";

import {
  propagateAudienceCreate,
  propagateAudienceUpdate,
  propagateAudienceDelete,
} from "../propagate";

/**
 * Helper: create a fake adapter that records calls and returns configurable results.
 */
function createFakeAdapter(overrides: {
  syncSegment?: EmailProviderAdapter["syncSegment"];
  deleteSegment?: EmailProviderAdapter["deleteSegment"];
} = {}): EmailProviderAdapter & {
  calls: {
    syncSegment: Parameters<EmailProviderAdapter["syncSegment"]>[];
    deleteSegment: Parameters<EmailProviderAdapter["deleteSegment"]>[];
  };
} {
  const calls = {
    syncSegment: [] as Parameters<EmailProviderAdapter["syncSegment"]>[],
    deleteSegment: [] as Parameters<EmailProviderAdapter["deleteSegment"]>[],
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
    createContact: async () => ({ errors: [], newExternalId: "ext" }),
    deleteContact: async () => ({ errors: [] }),
    upsertContact: async () => ({ errors: [], externalId: "ext" }),
    deleteSegment:
      overrides.deleteSegment ??
      (async (...args) => {
        calls.deleteSegment.push(args);
        return { errors: [] };
      }),
    sendBulk: async () => ({ success: true }),
  };
}

// ─── Shared cleanup ─────────────────────────────────────────────────────────

const createdAudienceIds: string[] = [];

async function createAudience(name = "Test Audience", externalId?: string | null) {
  const audience = await db.emailAudience.create({
    data: {
      name,
      ...(externalId !== undefined ? { externalId } : {}),
    },
  });
  createdAudienceIds.push(audience.id);
  return audience;
}

beforeEach(async () => {
  await db.emailAudience.deleteMany({});
  createdAudienceIds.length = 0;
});

afterEach(async () => {
  if (createdAudienceIds.length > 0) {
    await db.emailAudience.deleteMany({
      where: { id: { in: createdAudienceIds } },
    });
  }
  createdAudienceIds.length = 0;
});

// ─── propagateAudienceCreate ────────────────────────────────────────────────

describe("propagateAudienceCreate", () => {
  it("calls syncSegment(null, name) and saves externalId", async () => {
    const audience = await createAudience("My Audience");

    const adapter = createFakeAdapter({
      syncSegment: async (...args) => {
        adapter.calls.syncSegment.push(args);
        return { errors: [], newExternalId: "provider-seg-123" };
      },
    });

    const result = await propagateAudienceCreate(audience.id, adapter);

    expect(result.propagationWarning).toBeUndefined();
    expect(adapter.calls.syncSegment).toHaveLength(1);
    expect(adapter.calls.syncSegment[0]).toEqual([null, "My Audience"]);

    // externalId should be persisted
    const updated = await db.emailAudience.findUnique({
      where: { id: audience.id },
    });
    expect(updated?.externalId).toBe("provider-seg-123");
  });

  it("returns propagationWarning when syncSegment fails", async () => {
    const audience = await createAudience("Fail Audience");

    const adapter = createFakeAdapter({
      syncSegment: async () => ({
        errors: ["Provider unavailable"],
      }),
    });

    const result = await propagateAudienceCreate(audience.id, adapter);

    expect(result.propagationWarning).toBe("Provider error: Provider unavailable");
    // Audience should still exist in DB (local operation succeeded)
    const stillExists = await db.emailAudience.findUnique({
      where: { id: audience.id },
    });
    expect(stillExists).not.toBeNull();
  });

  it("returns propagationWarning on unexpected error without throwing", async () => {
    const audience = await createAudience("Crash Audience");

    const adapter = createFakeAdapter({
      syncSegment: async () => {
        throw new Error("Network timeout");
      },
    });

    const result = await propagateAudienceCreate(audience.id, adapter);

    expect(result.propagationWarning).toBe("Network timeout");
    // Audience should still exist
    const stillExists = await db.emailAudience.findUnique({
      where: { id: audience.id },
    });
    expect(stillExists).not.toBeNull();
  });

  it("returns warning when audience is not found", async () => {
    const adapter = createFakeAdapter();

    const result = await propagateAudienceCreate("non-existent-id", adapter);

    expect(result.propagationWarning).toBe("Audience not found");
  });
});

// ─── propagateAudienceUpdate ────────────────────────────────────────────────

describe("propagateAudienceUpdate", () => {
  it("calls syncSegment(externalId, newName) for rename", async () => {
    const audience = await createAudience("Old Name", "ext-seg-1");

    // Rename the audience in DB first
    await db.emailAudience.update({
      where: { id: audience.id },
      data: { name: "New Name" },
    });

    const adapter = createFakeAdapter({
      syncSegment: async (...args) => {
        adapter.calls.syncSegment.push(args);
        return { errors: [] };
      },
    });

    const result = await propagateAudienceUpdate(audience.id, adapter);

    expect(result.propagationWarning).toBeUndefined();
    expect(adapter.calls.syncSegment).toHaveLength(1);
    expect(adapter.calls.syncSegment[0]).toEqual(["ext-seg-1", "New Name"]);
  });

  it("falls back to syncSegment(null, name) when no externalId", async () => {
    const audience = await createAudience("No External");

    const adapter = createFakeAdapter({
      syncSegment: async (...args) => {
        adapter.calls.syncSegment.push(args);
        return { errors: [], newExternalId: "newly-created-seg" };
      },
    });

    const result = await propagateAudienceUpdate(audience.id, adapter);

    expect(result.propagationWarning).toBeUndefined();
    expect(adapter.calls.syncSegment).toHaveLength(1);
    expect(adapter.calls.syncSegment[0]).toEqual([null, "No External"]);

    // externalId should now be persisted
    const updated = await db.emailAudience.findUnique({
      where: { id: audience.id },
    });
    expect(updated?.externalId).toBe("newly-created-seg");
  });

  it("returns propagationWarning when syncSegment fails", async () => {
    const audience = await createAudience("Fail Update", "ext-seg-2");

    const adapter = createFakeAdapter({
      syncSegment: async () => ({
        errors: ["Rate limit exceeded"],
      }),
    });

    const result = await propagateAudienceUpdate(audience.id, adapter);

    expect(result.propagationWarning).toBe("Provider error: Rate limit exceeded");
    // Audience should still exist
    const stillExists = await db.emailAudience.findUnique({
      where: { id: audience.id },
    });
    expect(stillExists).not.toBeNull();
  });

  it("returns propagationWarning on unexpected error without throwing", async () => {
    const audience = await createAudience("Crash Update", "ext-seg-3");

    const adapter = createFakeAdapter({
      syncSegment: async () => {
        throw new Error("Connection refused");
      },
    });

    const result = await propagateAudienceUpdate(audience.id, adapter);

    expect(result.propagationWarning).toBe("Connection refused");
  });

  it("returns warning when audience is not found", async () => {
    const adapter = createFakeAdapter();

    const result = await propagateAudienceUpdate("non-existent-id", adapter);

    expect(result.propagationWarning).toBe("Audience not found");
  });
});

// ─── propagateAudienceDelete ────────────────────────────────────────────────

describe("propagateAudienceDelete", () => {
  it("calls deleteSegment with the audience externalId", async () => {
    const audience = await createAudience("To Delete", "ext-to-delete");

    const adapter = createFakeAdapter();
    const result = await propagateAudienceDelete(audience.id, adapter);

    expect(result.propagationWarning).toBeUndefined();
    expect(adapter.calls.deleteSegment).toHaveLength(1);
    expect(adapter.calls.deleteSegment[0]).toEqual(["ext-to-delete"]);
  });

  it("skips the provider call when externalId is missing", async () => {
    const audience = await createAudience("No External Delete");

    const adapter = createFakeAdapter();
    const result = await propagateAudienceDelete(audience.id, adapter);

    expect(result.propagationWarning).toBeUndefined();
    expect(adapter.calls.deleteSegment).toHaveLength(0);
  });

  it("returns propagationWarning when deleteSegment fails", async () => {
    const audience = await createAudience("Fail Delete", "ext-fail");

    const adapter = createFakeAdapter({
      deleteSegment: async () => ({
        errors: ["Segment already removed"],
      }),
    });

    const result = await propagateAudienceDelete(audience.id, adapter);

    expect(result.propagationWarning).toBe(
      "Provider error: Segment already removed",
    );
  });

  it("returns propagationWarning on unexpected error without throwing", async () => {
    const audience = await createAudience("Crash Delete", "ext-crash");

    const adapter = createFakeAdapter({
      deleteSegment: async () => {
        throw new Error("Provider unreachable");
      },
    });

    const result = await propagateAudienceDelete(audience.id, adapter);

    expect(result.propagationWarning).toBe("Provider unreachable");
  });

  it("returns warning when audience is not found", async () => {
    const adapter = createFakeAdapter();

    const result = await propagateAudienceDelete("non-existent-id", adapter);

    expect(result.propagationWarning).toBe("Audience not found");
  });
});
