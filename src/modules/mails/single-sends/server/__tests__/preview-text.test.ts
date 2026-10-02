import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the protected procedure for a plain one so the round-trip can be
// exercised against the test database without a session.
vi.mock("@/trpc/init", async () => {
  const { initTRPC } = await import("@trpc/server");
  const superjson = (await import("superjson")).default;
  const t = initTRPC.create({ transformer: superjson });

  return {
    createTRPCRouter: t.router,
    createCallerFactory: t.createCallerFactory,
    baseProcedure: t.procedure,
    protectedProcedure: t.procedure,
    permissionProcedure: () => t.procedure,
  };
});

import { createCallerFactory } from "@/trpc/init";

import { db } from "@/shared/lib/db";

import { singleSendsRouter } from "../procedures";

const createCaller = createCallerFactory(singleSendsRouter);
const caller = createCaller({ userId: "test-user" });

describe("singleSends procedures — previewText round-trip", () => {
  const createdSingleSendIds: string[] = [];
  const createdAudienceIds: string[] = [];

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

  it("persists previewText on create and returns it from getOne", async () => {
    const created = await caller.create({
      name: "Newsletter",
      emailTemplateId: "",
      previewText: "A short teaser",
      audiences: [],
    });
    createdSingleSendIds.push(created.id);

    expect(created.previewText).toBe("A short teaser");

    const fetched = await caller.getOne({ id: created.id });

    expect(fetched.previewText).toBe("A short teaser");
  });

  it("updates previewText and returns the new value from getOne", async () => {
    const audience = await db.emailAudience.create({
      data: { name: "Audience", externalId: `aud-${randomUUID()}` },
    });
    createdAudienceIds.push(audience.id);

    const created = await caller.create({
      name: "Newsletter",
      emailTemplateId: "",
      previewText: "Original",
      audiences: [{ id: audience.id }],
    });
    createdSingleSendIds.push(created.id);

    await caller.update({
      id: created.id,
      name: "Newsletter",
      subject: "Subject",
      previewText: "Updated",
      audiences: [{ id: audience.id }],
    });

    const fetched = await caller.getOne({ id: created.id });

    expect(fetched.previewText).toBe("Updated");
  });
});
