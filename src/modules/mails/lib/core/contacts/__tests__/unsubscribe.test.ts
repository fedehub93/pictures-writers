import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { db } from "@/shared/lib/db";
import type { EmailProviderAdapter } from "@/modules/mails/lib/types";

import { unsubscribeContactById } from "../unsubscribe";

/**
 * Helper: create a fake adapter that records calls and returns configurable results.
 */
function createFakeAdapter(
  overrides: {
    deleteContact?: EmailProviderAdapter["deleteContact"];
  } = {},
): EmailProviderAdapter & {
  calls: {
    deleteContact: Parameters<EmailProviderAdapter["deleteContact"]>[];
  };
} {
  const calls = {
    deleteContact: [] as Parameters<EmailProviderAdapter["deleteContact"]>[],
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
    createContact: async (...args) => ({ errors: [], newExternalId: `ext-${args[1]}` }),
    deleteContact:
      overrides.deleteContact ??
      (async (...args) => {
        calls.deleteContact.push(args);
        return { errors: [] };
      }),
    upsertContact: async (...args) => ({ errors: [], externalId: `ext-${args[1]}` }),
    deleteSegment: async () => ({ errors: [] }),
    sendBulk: async () => ({ success: true }),
  };
}

// ─── Shared cleanup ─────────────────────────────────────────────────────────

const createdContactIds: string[] = [];

async function createContact(
  email: string,
  overrides: { isSubscriber?: boolean; externalId?: string } = {},
) {
  const contact = await db.emailContact.create({
    data: {
      email,
      isSubscriber: overrides.isSubscriber ?? true,
      externalId: overrides.externalId ?? undefined,
    },
  });
  createdContactIds.push(contact.id);
  return contact;
}

beforeEach(async () => {
  await db.emailContact.deleteMany({});
  createdContactIds.length = 0;
});

afterEach(async () => {
  if (createdContactIds.length > 0) {
    await db.emailContact.deleteMany({
      where: { id: { in: createdContactIds } },
    });
  }
  createdContactIds.length = 0;
});

// ─── unsubscribeContactById ─────────────────────────────────────────────────

describe("unsubscribeContactById", () => {
  it("revokes consent but keeps the contact row", async () => {
    const contact = await createContact("revoke@test.com", {
      isSubscriber: true,
      externalId: "ext-1",
    });

    const adapter = createFakeAdapter();
    const result = await unsubscribeContactById(contact.id, adapter);

    expect(result).toBe(true);

    const updated = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(updated).not.toBeNull();
    expect(updated?.isSubscriber).toBe(false);
    expect(adapter.calls.deleteContact).toHaveLength(1);
  });

  it("does not propagate provider error lists", async () => {
    const contact = await createContact("provider-error@test.com");

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const adapter = createFakeAdapter({
      deleteContact: async () => ({ errors: ["Provider unavailable"] }),
    });

    const result = await unsubscribeContactById(contact.id, adapter);

    expect(result).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalled();

    const updated = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(updated?.isSubscriber).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it("does not propagate when the provider call throws", async () => {
    const contact = await createContact("provider-crash@test.com");

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const adapter = createFakeAdapter({
      deleteContact: async () => {
        throw new Error("Network timeout");
      },
    });

    const result = await unsubscribeContactById(contact.id, adapter);

    expect(result).toBe(true);

    const updated = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(updated?.isSubscriber).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it("is idempotent on a second call", async () => {
    const contact = await createContact("idempotent@test.com");

    const adapter = createFakeAdapter();

    const first = await unsubscribeContactById(contact.id, adapter);
    const second = await unsubscribeContactById(contact.id, adapter);

    expect(first).toBe(true);
    expect(second).toBe(true);

    const updated = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(updated?.isSubscriber).toBe(false);
  });

  it("returns false for a non-existent id and does not touch the provider", async () => {
    const adapter = createFakeAdapter();

    const result = await unsubscribeContactById(randomUUID(), adapter);

    expect(result).toBe(false);
    expect(adapter.calls.deleteContact).toHaveLength(0);
  });
});
