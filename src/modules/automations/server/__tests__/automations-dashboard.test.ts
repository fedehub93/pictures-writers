import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { AutomationRunStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { cleanupAutomationTables } from "@/modules/automations";

import { automationsRouter } from "../procedures";

const createCaller = createCallerFactory(automationsRouter);
const automationIds: string[] = [];

async function createRun(
  status: AutomationRunStatus,
  name = `Flow ${randomUUID()}`,
) {
  const automation = await db.automation.create({ data: { name } });
  automationIds.push(automation.id);

  const run = await db.automationRun.create({
    data: {
      automationId: automation.id,
      triggerType: "manual",
      status,
      graph: {},
      error: status === AutomationRunStatus.FAILED ? "Boom" : null,
    },
  });

  return { run, automation };
}

beforeEach(async () => {
  // `getFailedRuns` counts runs globally, so a sibling suite that leaves runs
  // behind would break the assertion. Wipe the automation tables first.
  await cleanupAutomationTables();
  automationIds.length = 0;
});

afterEach(async () => {
  if (automationIds.length > 0) {
    await db.automation.deleteMany({ where: { id: { in: automationIds } } });
  }
  automationIds.length = 0;
});

describe("automations.getFailedRuns", () => {
  it("counts and lists failed runs only, with the automation name", async () => {
    const failed = await createRun(AutomationRunStatus.FAILED, "Flusso rotto");
    await createRun(AutomationRunStatus.COMPLETED);
    await createRun(AutomationRunStatus.RUNNING);

    const result = await createCaller({
      userId: "any-user",
    }).getFailedRuns();

    expect(result.count).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(failed.run.id);
    expect(result.items[0]?.automationId).toBe(failed.automation.id);
    expect(result.items[0]?.automationName).toBe("Flusso rotto");
    expect(result.items[0]?.error).toBe("Boom");
  });
});
