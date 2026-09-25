import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import { AutomationStatus, AutomationRunStepStatus } from "@/generated/prisma";
import { cleanupAutomationTables } from "@/modules/automations";

import { enqueueRun } from "../automation-ingestion";
import {
  claimDueAutomationStep,
  runDueAutomations,
} from "../automation-runner";
import { createInMemoryEffects } from "../effects";
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
      runId: run!.id,
      stepId: expect.any(String),
      input: { value: 1 },
      payload: { value: 1 },
      config: { url: "https://example.test" },
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
});
