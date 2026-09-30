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
  claimDueAutomationStep,
  runDueAutomations,
} from "../automation-runner";
import { createInMemoryEffects } from "../effects";
import type { JsonValue } from "../graph";
import { TransientAutomationNodeError } from "../node-registry";

const graph = {
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

describe("automation engine", () => {
  beforeEach(async () => {
    await cleanupAutomationTables();
  });

  it("enqueues a published graph with its first pending Step", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Published flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: graph,
      },
    });

    const run = await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload: { email: "reader@example.com" },
    });

    expect(run).not.toBeNull();
    expect(run?.graph).toEqual(graph);
    expect(run?.status).toBe("RUNNING");

    const steps = await db.automationRunStep.findMany({
      where: { runId: run!.id },
      orderBy: { seq: "asc" },
    });
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({
      nodeId: "trigger",
      seq: 1,
      status: AutomationRunStepStatus.PENDING,
      attempts: 0,
      input: { email: "reader@example.com" },
    });
  });

  it("does not enqueue automated triggers for an unpublished Automation", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Draft flow",
        status: AutomationStatus.DRAFT,
        publishedSnapshot: graph,
      },
    });

    const automatedRun = await enqueueRun({
      automationId: automation.id,
      triggerType: "cron",
    });
    const manualRun = await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
    });

    expect(automatedRun).toBeNull();
    expect(manualRun).toBeNull();
    expect(await db.automationRun.count()).toBe(0);
  });

  it("deduplicates an active Run by opaque idempotency key", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Dedup flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: graph,
      },
    });
    const input = {
      automationId: automation.id,
      triggerType: "manual",
      idempotencyKey: "submission-42",
    };

    const first = await enqueueRun(input);
    const second = await enqueueRun(input);

    expect(second?.id).toBe(first?.id);
    expect(await db.automationRun.count()).toBe(1);
  });

  it("keeps the published snapshot attached to a live Run", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Snapshot flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: graph,
      },
    });
    const run = await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
    });

    await db.automation.update({
      where: { id: automation.id },
      data: {
        publishedSnapshot: {
          ...graph,
          nodes: graph.nodes.map((node) =>
            node.id === "wait"
              ? { ...node, data: { delayMs: 1 } }
              : node,
          ),
        },
      },
    });

    const stored = await db.automationRun.findUnique({ where: { id: run!.id } });
    expect(stored?.graph).toEqual(graph);
  });

  it("reclaims a Step after its lease expires", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Lease flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: graph,
      },
    });
    const start = new Date("2026-09-25T11:00:00.000Z");
    const run = await enqueueRun(
      { automationId: automation.id, triggerType: "manual" },
      start,
    );
    const claimed = await claimDueAutomationStep({
      now: start,
      leaseMs: 1_000,
    });

    expect(claimed).toMatchObject({
      id: (await db.automationRunStep.findFirst({ where: { runId: run!.id } }))?.id,
      status: AutomationRunStepStatus.RUNNING,
      attempts: 1,
    });

    const result = await runDueAutomations({
      now: new Date("2026-09-25T11:00:02.000Z"),
    });

    expect(result.succeeded).toBe(1);
    const completed = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "trigger" },
    });
    expect(completed).toMatchObject({
      status: AutomationRunStepStatus.COMPLETED,
      attempts: 2,
      leaseId: null,
    });
  });

  it("sleeps on a wait Step and resumes across pumps", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Wait flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: graph,
      },
    });
    const start = new Date("2026-09-25T12:00:00.000Z");
    const run = await enqueueRun(
      {
        automationId: automation.id,
        triggerType: "manual",
        payload: { value: 1 },
      },
      start,
    );
    const effects = createInMemoryEffects();

    const first = await runDueAutomations({ now: start, effects });
    const createdWait = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "wait" },
    });
    expect(first.succeeded).toBe(1);
    expect(createdWait).toMatchObject({
      status: AutomationRunStepStatus.PENDING,
      attempts: 0,
      resumeAt: null,
    });

    await runDueAutomations({ now: start, effects });
    const waiting = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "wait" },
    });
    const runningAfterWait = await db.automationRun.findUnique({
      where: { id: run!.id },
    });

    expect(waiting).toMatchObject({
      status: AutomationRunStepStatus.PENDING,
      attempts: 1,
      resumeAt: new Date("2026-09-25T12:01:00.000Z"),
      leaseId: null,
    });
    expect(runningAfterWait?.status).toBe("RUNNING");

    const early = await runDueAutomations({
      now: new Date("2026-09-25T12:00:59.999Z"),
      effects,
    });
    expect(early.processed).toBe(0);

    const resume = await runDueAutomations({
      now: new Date("2026-09-25T12:01:00.000Z"),
      effects,
    });
    expect(resume.succeeded).toBe(1);

    await runDueAutomations({
      now: new Date("2026-09-25T12:01:00.000Z"),
      effects,
    });

    const completed = await db.automationRun.findUnique({
      where: { id: run!.id },
      include: { steps: { orderBy: { seq: "asc" } } },
    });
    expect(completed?.status).toBe("COMPLETED");
    expect(completed?.steps).toHaveLength(3);
    expect(completed?.steps.every((step) => step.status === AutomationRunStepStatus.COMPLETED)).toBe(true);
    expect(completed?.steps.find((step) => step.nodeId === "wait")?.attempts).toBe(1);
  });

  it("resumes a wait at a time of day in the site time zone", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Anchored wait flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: {
          nodes: [
            { id: "trigger", type: "manual", data: {} },
            {
              id: "wait",
              type: "wait",
              data: { delay: "2 days", timeOfDay: "10:00" },
            },
            { id: "end", type: "end", data: {} },
          ],
          connections: [
            { fromNodeId: "trigger", toNodeId: "wait" },
            { fromNodeId: "wait", toNodeId: "end" },
          ],
        },
      },
    });
    // 2026-09-24 16:00 in Europe/Rome.
    const start = new Date("2026-09-24T14:00:00.000Z");
    const run = await enqueueRun(
      { automationId: automation.id, triggerType: "manual" },
      start,
    );

    await runDueAutomations({ now: start, timeZone: "Europe/Rome" });
    await runDueAutomations({ now: start, timeZone: "Europe/Rome" });

    const waiting = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "wait" },
    });
    // Thu 16:00 -> Sat 10:00 in Rome, i.e. 08:00Z.
    expect(waiting?.resumeAt?.toISOString()).toBe(
      "2026-09-26T08:00:00.000Z",
    );
  });

  it("passes node requests through the injected effects context", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Effects flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: {
          nodes: [
            { id: "trigger", type: "manual", data: {} },
            { id: "request", type: "httpRequest", data: { url: "https://example.test" } },
          ],
          connections: [{ fromNodeId: "trigger", toNodeId: "request" }],
        },
      },
    });
    const run = await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload: { value: 1 },
    });
    const effects = createInMemoryEffects();

    await runDueAutomations({ effects });
    await runDueAutomations({ effects });

    expect(effects.httpCalls).toHaveLength(1);
    expect(effects.httpCalls[0]).toMatchObject({
      run: { id: run!.id, triggerType: "manual" },
      step: { id: expect.any(String), attempts: 1 },
      credentialId: null,
      input: { value: 1 },
      payload: { value: 1 },
      config: { method: "GET", url: "https://example.test" },
    });
  });

  it("retries transient node failures with bounded backoff", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Retry flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: {
          nodes: [
            { id: "trigger", type: "manual", data: {} },
            { id: "flaky", type: "flaky", data: {} },
            { id: "end", type: "end", data: {} },
          ],
          connections: [
            { fromNodeId: "trigger", toNodeId: "flaky" },
            { fromNodeId: "flaky", toNodeId: "end" },
          ],
        },
      },
    });
    const start = new Date("2026-09-25T13:00:00.000Z");
    const run = await enqueueRun(
      {
        automationId: automation.id,
        triggerType: "manual",
      },
      start,
    );
    let calls = 0;
    const registry = {
      flaky: async () => {
        calls++;
        if (calls < 3) {
          throw new TransientAutomationNodeError(`Temporary failure ${calls}`);
        }
        return { output: { ok: true } };
      },
    };

    await runDueAutomations({ now: start, registry });
    await runDueAutomations({ now: start, registry });

    const firstRetry = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "flaky" },
    });
    expect(firstRetry).toMatchObject({
      status: AutomationRunStepStatus.PENDING,
      attempts: 1,
      resumeAt: new Date("2026-09-25T13:05:00.000Z"),
      error: "Temporary failure 1",
    });

    await runDueAutomations({
      now: new Date("2026-09-25T13:05:00.000Z"),
      registry,
    });

    const secondRetry = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "flaky" },
    });
    expect(secondRetry).toMatchObject({
      status: AutomationRunStepStatus.PENDING,
      attempts: 2,
      resumeAt: new Date("2026-09-25T13:10:00.000Z"),
      error: "Temporary failure 2",
    });

    await runDueAutomations({
      now: new Date("2026-09-25T13:10:00.000Z"),
      registry,
    });
    await runDueAutomations({
      now: new Date("2026-09-25T13:10:00.000Z"),
    });

    const completed = await db.automationRun.findUnique({
      where: { id: run!.id },
    });
    expect(calls).toBe(3);
    expect(completed?.status).toBe("COMPLETED");
  });

  it("marks a Run failed after the transient retry limit", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Failure flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: {
          nodes: [
            { id: "trigger", type: "manual", data: {} },
            { id: "bad", type: "bad", data: {} },
          ],
          connections: [{ fromNodeId: "trigger", toNodeId: "bad" }],
        },
      },
    });
    const start = new Date("2026-09-25T14:00:00.000Z");
    const run = await enqueueRun(
      { automationId: automation.id, triggerType: "manual" },
      start,
    );
    const registry = {
      bad: async () => {
        throw new TransientAutomationNodeError("Provider unavailable");
      },
    };

    await runDueAutomations({ now: start, registry });
    await runDueAutomations({ now: start, registry });
    await runDueAutomations({
      now: new Date("2026-09-25T14:05:00.000Z"),
      registry,
    });
    await runDueAutomations({
      now: new Date("2026-09-25T14:10:00.000Z"),
      registry,
    });

    const failedRun = await db.automationRun.findUnique({
      where: { id: run!.id },
      include: { steps: true },
    });
    const failedStep = failedRun?.steps.find((step) => step.nodeId === "bad");
    expect(failedRun?.status).toBe("FAILED");
    expect(failedRun?.error).toBe("Provider unavailable");
    expect(failedStep).toMatchObject({
      status: AutomationRunStepStatus.FAILED,
      attempts: 3,
      error: "Provider unavailable",
      leaseId: null,
    });
  });

  it("does not report a retry when the worker has lost its lease", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Lease loss flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: {
          nodes: [
            { id: "trigger", type: "manual", data: {} },
            { id: "flaky", type: "flaky", data: {} },
          ],
          connections: [{ fromNodeId: "trigger", toNodeId: "flaky" }],
        },
      },
    });
    const start = new Date("2026-09-25T15:00:00.000Z");
    const run = await enqueueRun(
      { automationId: automation.id, triggerType: "manual" },
      start,
    );
    let releaseLease = false;
    const registry = {
      flaky: async () => {
        if (releaseLease) {
          await db.automationRunStep.updateMany({
            where: { runId: run!.id, nodeId: "flaky" },
            data: { leaseId: "another-worker" },
          });
        }
        throw new TransientAutomationNodeError("Temporary failure");
      },
    };

    await runDueAutomations({ now: start, registry });
    releaseLease = true;
    const result = await runDueAutomations({
      now: new Date("2026-09-25T15:05:00.000Z"),
      registry,
    });

    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.details[0]?.status).toBe("skipped");
  });

  it("executes a linear chain through connections and terminalizes", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Chain flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: {
          nodes: [
            { id: "trigger", type: "manual", data: {} },
            { id: "a", type: "a", data: {} },
            { id: "b", type: "b", data: {} },
            { id: "end", type: "end", data: {} },
          ],
          connections: [
            { fromNodeId: "trigger", toNodeId: "a" },
            { fromNodeId: "a", toNodeId: "b" },
            { fromNodeId: "b", toNodeId: "end" },
          ],
        },
      },
    });
    const calls: Array<{ nodeId: string; input: unknown }> = [];
    const registry = {
      a: async (ctx: { input: unknown }) => {
        calls.push({ nodeId: "a", input: ctx.input });
        return { output: { from: "a" } };
      },
      b: async (ctx: { input: unknown }) => {
        calls.push({ nodeId: "b", input: ctx.input });
        return { output: { from: "b" } };
      },
    };

    const run = await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload: { start: 1 },
    });

    // Trigger, a, b, end each require a separate pump call in a linear chain.
    await runDueAutomations({ registry });
    await runDueAutomations({ registry });
    await runDueAutomations({ registry });
    await runDueAutomations({ registry });

    const completed = await db.automationRun.findUnique({
      where: { id: run!.id },
      include: { steps: { orderBy: { seq: "asc" } } },
    });

    expect(completed?.status).toBe("COMPLETED");
    expect(calls).toEqual([
      { nodeId: "a", input: { start: 1 } },
      { nodeId: "b", input: { from: "a" } },
    ]);
    expect(
      completed?.steps.map((step) => ({
        nodeId: step.nodeId,
        status: step.status,
      })),
    ).toEqual([
      { nodeId: "trigger", status: AutomationRunStepStatus.COMPLETED },
      { nodeId: "a", status: AutomationRunStepStatus.COMPLETED },
      { nodeId: "b", status: AutomationRunStepStatus.COMPLETED },
      { nodeId: "end", status: AutomationRunStepStatus.COMPLETED },
    ]);
  });

  it("fans out from one node to two successors", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Fan-out flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: {
          nodes: [
            { id: "trigger", type: "manual", data: {} },
            { id: "split", type: "split", data: {} },
            { id: "a", type: "a", data: {} },
            { id: "b", type: "b", data: {} },
          ],
          connections: [
            { fromNodeId: "trigger", toNodeId: "split" },
            { fromNodeId: "split", toNodeId: "a" },
            { fromNodeId: "split", toNodeId: "b" },
          ],
        },
      },
    });
    const calls: string[] = [];
    const registry = {
      split: async () => ({ output: { value: 1 } }),
      a: async () => {
        calls.push("a");
        return { output: { branch: "a" } };
      },
      b: async () => {
        calls.push("b");
        return { output: { branch: "b" } };
      },
    };

    const run = await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
    });

    await runDueAutomations({ registry });
    await runDueAutomations({ registry });
    await runDueAutomations({ registry });

    expect(calls.sort()).toEqual(["a", "b"]);
    const steps = await db.automationRunStep.findMany({
      where: { runId: run!.id },
      orderBy: { seq: "asc" },
    });
    expect(steps).toHaveLength(4);
    expect(
      steps
        .filter((step) => step.nodeId === "a" || step.nodeId === "b")
        .every((step) => step.status === AutomationRunStepStatus.COMPLETED),
    ).toBe(true);
  });

  it("routes a conditional node to only the matched output", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Conditional flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: {
          nodes: [
            { id: "trigger", type: "manual", data: {} },
            {
              id: "cond",
              type: "conditional",
              data: { path: "tier", operator: "equals", value: "{{ payload.tier }}" },
            },
            { id: "trueBranch", type: "trueBranch", data: {} },
            { id: "falseBranch", type: "falseBranch", data: {} },
          ],
          connections: [
            { fromNodeId: "trigger", toNodeId: "cond" },
            {
              fromNodeId: "cond",
              toNodeId: "trueBranch",
              fromOutput: "true",
            },
            {
              fromNodeId: "cond",
              toNodeId: "falseBranch",
              fromOutput: "false",
            },
          ],
        },
      },
    });
    const calls: string[] = [];
    const registry = {
      trueBranch: async () => {
        calls.push("trueBranch");
        return { output: { branch: "true" } };
      },
      falseBranch: async () => {
        calls.push("falseBranch");
        return { output: { branch: "false" } };
      },
    };

    const run = await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload: { tier: "pro" },
    });

    await runDueAutomations({ registry });
    await runDueAutomations({ registry });
    await runDueAutomations({ registry });

    expect(calls).toEqual(["trueBranch"]);
    const steps = await db.automationRunStep.findMany({
      where: { runId: run!.id },
      orderBy: { seq: "asc" },
    });
    expect(steps).toHaveLength(3);
    expect(
      steps.find((step) => step.nodeId === "falseBranch"),
    ).toBeUndefined();
  });

  it("creates one Step per incoming token for a node with multiple inputs", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Per-token flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: {
          nodes: [
            { id: "trigger", type: "manual", data: {} },
            { id: "a", type: "a", data: {} },
            { id: "b", type: "b", data: {} },
            { id: "merge", type: "merge", data: {} },
          ],
          connections: [
            { fromNodeId: "trigger", toNodeId: "a" },
            { fromNodeId: "trigger", toNodeId: "b" },
            { fromNodeId: "a", toNodeId: "merge" },
            { fromNodeId: "b", toNodeId: "merge" },
          ],
        },
      },
    });
    const inputs: unknown[] = [];
    const registry = {
      a: async () => ({ output: { branch: "a" } }),
      b: async () => ({ output: { branch: "b" } }),
      merge: async (ctx: { input: unknown }) => {
        inputs.push(ctx.input);
        return { output: ctx.input as JsonValue };
      },
    };

    const run = await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
    });

    // Trigger -> a and b (fan-out)
    await runDueAutomations({ registry });
    // a and b -> merge (two independent tokens)
    await runDueAutomations({ registry });
    // Execute both merge steps (per-token, no join)
    await runDueAutomations({ registry });

    expect(inputs).toHaveLength(2);
    expect(inputs).toEqual(
      expect.arrayContaining([{ branch: "a" }, { branch: "b" }]),
    );

    const mergeSteps = await db.automationRunStep.findMany({
      where: { runId: run!.id, nodeId: "merge" },
      orderBy: { seq: "asc" },
    });
    expect(mergeSteps).toHaveLength(2);
    expect(mergeSteps.map((step) => step.input)).toEqual(
      expect.arrayContaining([{ branch: "a" }, { branch: "b" }]),
    );
  });

  it("cancels a Run that exceeds the 500-execution guard", async () => {
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

    const automation = await db.automation.create({
      data: {
        name: "Guard flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: { nodes, connections },
      },
    });
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

    expect(finalRun?.status).toBe("CANCELED");
    expect(finalRun?.error).toMatch(/500/);
    expect(finalRun?.error).toMatch(/execution limit/i);

    const completedCount = finalRun?.steps.filter(
      (step) => step.status === AutomationRunStepStatus.COMPLETED,
    ).length;
    expect(completedCount).toBeLessThanOrEqual(500);

    const skippedCount = finalRun?.steps.filter(
      (step) => step.status === AutomationRunStepStatus.SKIPPED,
    ).length;
    expect(skippedCount).toBeGreaterThanOrEqual(1);
    expect(result.details.some((detail) => detail.status === "skipped")).toBe(
      true,
    );
  });
});
