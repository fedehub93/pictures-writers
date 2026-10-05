import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import {
  AutomationRunStatus,
  AutomationRunStepStatus,
  AutomationStatus,
  Prisma,
} from "@/generated/prisma";
import { cleanupAutomationTables } from "@/modules/automations";

import { enqueueRun } from "../automation-ingestion";
import {
  cancelAutomationRun,
  runDueAutomations,
} from "../automation-runner";

const sleepingGraph = {
  nodes: [
    { id: "trigger", type: "manual", data: {} },
    { id: "wait", type: "wait", data: { delayMs: 60_000 } },
    { id: "end", type: "end", data: {} },
  ],
  connections: [
    { fromNodeId: "trigger", toNodeId: "wait" },
    { fromNodeId: "wait", toNodeId: "end" },
  ],
};

async function createPublishedAutomation(graph: unknown, name = "Cancel flow") {
  return db.automation.create({
    data: {
      name,
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: graph as Prisma.InputJsonValue,
    },
  });
}

describe("run cancellation", () => {
  beforeEach(async () => {
    await cleanupAutomationTables();
  });

  it("stops a Run sleeping on a Wait Step so its next Step never executes", async () => {
    const automation = await createPublishedAutomation(sleepingGraph);
    const start = new Date("2026-09-25T12:00:00.000Z");
    const run = await enqueueRun(
      { automationId: automation.id, triggerType: "manual" },
      start,
    );

    // Pump 1 executes the trigger; pump 2 puts the Wait Step to sleep.
    await runDueAutomations({ now: start });
    await runDueAutomations({ now: start });

    const sleeping = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "wait" },
    });
    expect(sleeping?.status).toBe(AutomationRunStepStatus.PENDING);
    expect(sleeping?.resumeAt).not.toBeNull();

    const canceled = await cancelAutomationRun({
      runId: run!.id,
      reason: "Fake email address",
    });
    expect(canceled).toBe(true);

    const stored = await db.automationRun.findUnique({
      where: { id: run!.id },
    });
    expect(stored).toMatchObject({
      status: AutomationRunStatus.CANCELED,
      cancelReason: "Fake email address",
      error: null,
    });
    expect(stored?.endedAt).not.toBeNull();

    const skipped = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "wait" },
    });
    expect(skipped).toMatchObject({
      status: AutomationRunStepStatus.SKIPPED,
      resumeAt: null,
      leaseId: null,
      leaseExpiresAt: null,
    });

    // A later pump (past the original resume time) must do nothing.
    const pump = await runDueAutomations({
      now: new Date("2026-09-25T12:05:00.000Z"),
    });
    expect(pump.processed).toBe(0);

    const downstream = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "end" },
    });
    expect(downstream).toBeNull();
  });

  it("leaves no orphaned pending Step when a cancel races an in-flight Step", async () => {
    const graph = {
      nodes: [
        { id: "trigger", type: "manual", data: {} },
        { id: "action", type: "action", data: {} },
        { id: "end", type: "end", data: {} },
      ],
      connections: [
        { fromNodeId: "trigger", toNodeId: "action" },
        { fromNodeId: "action", toNodeId: "end" },
      ],
    };
    const automation = await createPublishedAutomation(graph, "Race flow");
    const start = new Date("2026-09-25T13:00:00.000Z");
    const run = await enqueueRun(
      { automationId: automation.id, triggerType: "manual" },
      start,
    );

    await runDueAutomations({ now: start });

    let canceledDuringStep = false;
    const registry = {
      action: async (ctx: { run: { id: string } }) => {
        canceledDuringStep = await cancelAutomationRun({
          runId: ctx.run.id,
          reason: "Canceled while running",
        });
        return { output: { ok: true } };
      },
    };

    await runDueAutomations({ now: start, registry });
    expect(canceledDuringStep).toBe(true);

    const stored = await db.automationRun.findUnique({
      where: { id: run!.id },
    });
    expect(stored?.status).toBe(AutomationRunStatus.CANCELED);

    const steps = await db.automationRunStep.findMany({
      where: { runId: run!.id },
    });
    expect(
      steps.filter((step) => step.status === AutomationRunStepStatus.PENDING),
    ).toHaveLength(0);
    expect(
      steps.find((step) => step.nodeId === "action")?.status,
    ).toBe(AutomationRunStepStatus.SKIPPED);
    expect(steps.find((step) => step.nodeId === "end")).toBeUndefined();
  });

  it("keeps a Step that finished before the cancel and skips its downstream Step", async () => {
    const graph = {
      nodes: [
        { id: "trigger", type: "manual", data: {} },
        { id: "action", type: "action", data: {} },
        { id: "end", type: "end", data: {} },
      ],
      connections: [
        { fromNodeId: "trigger", toNodeId: "action" },
        { fromNodeId: "action", toNodeId: "end" },
      ],
    };
    const automation = await createPublishedAutomation(graph, "Late cancel flow");
    const start = new Date("2026-09-25T13:30:00.000Z");
    const run = await enqueueRun(
      { automationId: automation.id, triggerType: "manual" },
      start,
    );

    // Trigger, then the action completes and enqueues its downstream Step.
    await runDueAutomations({ now: start });
    await runDueAutomations({
      now: start,
      registry: { action: async () => ({ output: { ok: true } }) },
    });

    const beforeCancel = await db.automationRunStep.findMany({
      where: { runId: run!.id },
    });
    expect(
      beforeCancel.find((step) => step.nodeId === "action")?.status,
    ).toBe(AutomationRunStepStatus.COMPLETED);
    expect(
      beforeCancel.find((step) => step.nodeId === "end")?.status,
    ).toBe(AutomationRunStepStatus.PENDING);

    await cancelAutomationRun({ runId: run!.id, reason: "Stop before end" });

    const afterCancel = await db.automationRunStep.findMany({
      where: { runId: run!.id },
    });
    // A Step that already finished stays COMPLETED; its downstream Step is skipped.
    expect(
      afterCancel.find((step) => step.nodeId === "action")?.status,
    ).toBe(AutomationRunStepStatus.COMPLETED);
    expect(afterCancel.find((step) => step.nodeId === "end")?.status).toBe(
      AutomationRunStepStatus.SKIPPED,
    );
    expect(
      afterCancel.filter(
        (step) => step.status === AutomationRunStepStatus.PENDING,
      ),
    ).toHaveLength(0);
  });

  it("is a no-op when the Run does not exist", async () => {
    const result = await cancelAutomationRun({
      runId: "00000000-0000-0000-0000-000000000000",
      reason: "Nothing to cancel",
    });

    expect(result).toBe(false);
  });

  it("is a no-op when the Run is already terminal", async () => {
    const automation = await createPublishedAutomation(sleepingGraph);
    const run = await db.automationRun.create({
      data: {
        automationId: automation.id,
        triggerType: "manual",
        graph: sleepingGraph as unknown as Prisma.InputJsonValue,
        status: AutomationRunStatus.COMPLETED,
        endedAt: new Date(),
      },
    });

    const result = await cancelAutomationRun({
      runId: run.id,
      reason: "Too late",
    });

    expect(result).toBe(false);
    const stored = await db.automationRun.findUnique({
      where: { id: run.id },
    });
    expect(stored).toMatchObject({
      status: AutomationRunStatus.COMPLETED,
      cancelReason: null,
    });
  });

  it("releases the idempotency key so the same trigger starts a new Run", async () => {
    const automation = await createPublishedAutomation(sleepingGraph);
    const start = new Date("2026-09-25T14:00:00.000Z");
    const input = {
      automationId: automation.id,
      triggerType: "manual",
      idempotencyKey: "submission-1",
    };

    const first = await enqueueRun(input, start);
    const deduped = await enqueueRun(input, start);
    expect(deduped?.id).toBe(first?.id);

    await cancelAutomationRun({ runId: first!.id, reason: "Stop it" });

    const restarted = await enqueueRun(input, start);
    expect(restarted).not.toBeNull();
    expect(restarted?.id).not.toBe(first?.id);
    expect(
      await db.automationRun.count({ where: { automationId: automation.id } }),
    ).toBe(2);
  });

  it("records the execution-limit message in cancelReason and leaves error null", async () => {
    // Pre-seed the ledger so the aggregate attempts sum already sits at the
    // limit; exercising the guard does not require running 500 real nodes.
    const leafCount = 500;
    const nodes = [
      { id: "trigger", type: "manual", data: {} },
      ...Array.from({ length: leafCount }, (_, index) => ({
        id: `leaf-${index}`,
        type: "leaf",
        data: {},
      })),
    ];
    const connections = Array.from({ length: leafCount }, (_, index) => ({
      fromNodeId: "trigger",
      toNodeId: `leaf-${index}`,
    }));

    const automation = await createPublishedAutomation(
      { nodes, connections },
      "Guard flow",
    );
    const registry = {
      leaf: async () => ({ output: { ok: true } }),
    };

    const run = await db.automationRun.create({
      data: {
        automationId: automation.id,
        triggerType: "manual",
        graph: { nodes, connections } as unknown as Prisma.InputJsonValue,
        payload: Prisma.DbNull,
        status: AutomationRunStatus.RUNNING,
        startedAt: new Date(),
        steps: {
          create: [
            {
              nodeId: "trigger",
              seq: 1,
              status: AutomationRunStepStatus.COMPLETED,
              attempts: 1,
              input: Prisma.DbNull,
              output: Prisma.DbNull,
            },
            ...Array.from({ length: leafCount }, (_, index) => ({
              nodeId: `leaf-${index}`,
              seq: index + 2,
              status: AutomationRunStepStatus.PENDING,
              attempts: 1,
              input: Prisma.DbNull,
            })),
          ],
        },
      },
      include: { steps: true },
    });

    const result = await runDueAutomations({ registry });

    const finalRun = await db.automationRun.findUnique({
      where: { id: run.id },
      include: { steps: true },
    });

    expect(finalRun?.status).toBe(AutomationRunStatus.CANCELED);
    expect(finalRun?.error).toBeNull();
    expect(finalRun?.cancelReason).toMatch(/500/);
    expect(finalRun?.cancelReason).toMatch(/execution limit/i);

    const skippedCount = finalRun?.steps.filter(
      (step) => step.status === AutomationRunStepStatus.SKIPPED,
    ).length;
    expect(skippedCount).toBeGreaterThanOrEqual(1);
    expect(result.details.some((detail) => detail.status === "skipped")).toBe(
      true,
    );
  });
});
