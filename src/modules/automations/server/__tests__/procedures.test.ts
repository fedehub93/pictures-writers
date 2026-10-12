import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the permission procedure for a plain one so the round-trip can be
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

import { cleanupAutomationTables } from "@/modules/automations";
import { AutomationRunStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { automationsRouter } from "../procedures";

const createCaller = createCallerFactory(automationsRouter);
const caller = createCaller({ userId: "test-user", auth: { id: "test-user" } });

async function createRun(
  automationId: string,
  status: AutomationRunStatus,
) {
  return db.automationRun.create({
    data: {
      automationId,
      triggerType: "manual",
      status,
      graph: {},
    },
  });
}

async function createAutomation(name: string) {
  return db.automation.create({ data: { name } });
}

// `getRuns` reads every automation, so the suite must start from an empty
// automation set: a sibling test file can leave runs behind, and a per-id
// cleanup of this file's own rows would not hide them.
beforeEach(async () => {
  await cleanupAutomationTables();
});

describe("automations.getRuns", () => {
  it("lists runs across every automation when no automationId is given", async () => {
    const first = await createAutomation(`First ${randomUUID()}`);
    const second = await createAutomation(`Second ${randomUUID()}`);
    await createRun(first.id, AutomationRunStatus.COMPLETED);
    await createRun(second.id, AutomationRunStatus.FAILED);

    const result = await caller.getRuns({ page: 1, pageSize: 100 });

    expect(result.total).toBe(2);
    expect(
      result.items.map((item) => item.automationId).sort(),
    ).toEqual([first.id, second.id].sort());
    expect(result.items.some((item) => item.automation.name.startsWith("First"))).toBe(
      true,
    );
  });

  it("scopes to a single automation when automationId is given", async () => {
    const first = await createAutomation(`First ${randomUUID()}`);
    const second = await createAutomation(`Second ${randomUUID()}`);
    await createRun(first.id, AutomationRunStatus.COMPLETED);
    await createRun(second.id, AutomationRunStatus.FAILED);

    const result = await caller.getRuns({
      automationId: second.id,
      page: 1,
      pageSize: 100,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.automationId).toBe(second.id);
  });

  it("filters by status across every automation", async () => {
    const first = await createAutomation(`First ${randomUUID()}`);
    await createRun(first.id, AutomationRunStatus.COMPLETED);
    const failed = await createRun(first.id, AutomationRunStatus.FAILED);

    const result = await caller.getRuns({
      status: AutomationRunStatus.FAILED,
      page: 1,
      pageSize: 100,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe(failed.id);
  });
});
