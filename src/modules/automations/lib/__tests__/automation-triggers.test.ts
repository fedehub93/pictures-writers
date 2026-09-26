import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import {
  AutomationRunStatus,
  AutomationRunStepStatus,
  AutomationStatus,
} from "@/generated/prisma";

import { enqueueRun } from "../automation-ingestion";
import {
  enqueueDueCronAutomations,
  enqueueWebhookRun,
} from "../automation-triggers";
import { runDueAutomations } from "../automation-runner";
import { cleanupAutomationTables } from "../cleanup";
import { hashWebhookSecret } from "../webhook-secret";

const manualGraph = {
  nodes: [
    { id: "trigger", type: "manual", data: {} },
    { id: "end", type: "end", data: {} },
  ],
  connections: [{ fromNodeId: "trigger", toNodeId: "end" }],
};

const cronGraph = {
  nodes: [
    { id: "clock", type: "CRON_TRIGGER", data: { interval: "1 hour" } },
    { id: "end", type: "end", data: {} },
  ],
  connections: [{ fromNodeId: "clock", toNodeId: "end" }],
};

const webhookGraph = {
  nodes: [
    { id: "hook", type: "WEBHOOK_TRIGGER", data: {} },
    { id: "end", type: "end", data: {} },
  ],
  connections: [{ fromNodeId: "hook", toNodeId: "end" }],
};

async function pumpToCompletion(runId: string, now: Date) {
  await runDueAutomations({ now });
  await runDueAutomations({ now });
  return db.automationRun.findUnique({
    where: { id: runId },
    include: { steps: { orderBy: { seq: "asc" } } },
  });
}

describe("trigger ingestion", () => {
  beforeEach(async () => {
    await cleanupAutomationTables();
  });

  it("starts a manual Run with the caller payload", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Manual flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: manualGraph,
      },
    });
    const now = new Date("2026-09-25T10:00:00.000Z");

    const run = await enqueueRun(
      {
        automationId: automation.id,
        triggerType: "manual",
        payload: { source: "manual", triggeredAt: now.toISOString() },
      },
      now,
    );

    expect(run?.status).toBe(AutomationRunStatus.RUNNING);
    expect(run?.triggerType).toBe("manual");
    expect(run?.payload).toEqual({
      source: "manual",
      triggeredAt: now.toISOString(),
    });

    const completed = await pumpToCompletion(run!.id, now);
    expect(completed?.status).toBe(AutomationRunStatus.COMPLETED);
    expect(completed?.steps.map((step) => step.nodeId)).toEqual([
      "trigger",
      "end",
    ]);
  });

  it("fires a cron Automation once its interval has elapsed", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Cron flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: cronGraph,
      },
    });
    const now = new Date("2026-09-25T12:00:00.000Z");

    const first = await enqueueDueCronAutomations({ now });
    expect(first.fired).toHaveLength(1);

    const run = await db.automationRun.findFirstOrThrow({
      where: { automationId: automation.id },
    });
    expect(run.triggerType).toBe("cron");
    expect((run.payload as { triggeredAt?: string })?.triggeredAt).toBe(
      now.toISOString(),
    );

    const early = await enqueueDueCronAutomations({
      now: new Date("2026-09-25T12:30:00.000Z"),
    });
    expect(early.fired).toHaveLength(0);

    const later = await enqueueDueCronAutomations({
      now: new Date("2026-09-25T13:01:00.000Z"),
    });
    expect(later.fired).toHaveLength(1);
    expect(await db.automationRun.count()).toBe(2);

    const completed = await pumpToCompletion(run.id, now);
    expect(completed?.status).toBe(AutomationRunStatus.COMPLETED);
    expect(completed?.steps[0]?.nodeId).toBe("clock");
  });

  it("never fires a cron trigger for an unpublished Automation", async () => {
    await db.automation.create({
      data: {
        name: "Draft cron",
        status: AutomationStatus.DRAFT,
        publishedSnapshot: cronGraph,
      },
    });

    const result = await enqueueDueCronAutomations({ now: new Date() });

    expect(result.fired).toHaveLength(0);
    expect(await db.automationRun.count()).toBe(0);
  });

  it("starts a webhook Run when the caller secret matches", async () => {
    const secret = "hook-secret";
    const automation = await db.automation.create({
      data: {
        name: "Webhook flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: webhookGraph,
        webhookSecretHash: hashWebhookSecret(secret),
      },
    });
    const now = new Date("2026-09-25T09:00:00.000Z");

    const result = await enqueueWebhookRun({
      automationId: automation.id,
      secret,
      payload: { hello: "world" },
      now,
    });

    expect(result).toEqual({ status: "accepted", runId: expect.any(String) });

    const run = await db.automationRun.findFirstOrThrow({
      where: { automationId: automation.id },
    });
    expect(run.triggerType).toBe("webhook");
    expect(run.payload).toEqual({ hello: "world" });

    const completed = await pumpToCompletion(run.id, now);
    expect(completed?.status).toBe(AutomationRunStatus.COMPLETED);
    expect(completed?.steps[0]?.status).toBe(
      AutomationRunStepStatus.COMPLETED,
    );
  });

  it("rejects a bad or missing webhook secret", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Webhook flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: webhookGraph,
        webhookSecretHash: hashWebhookSecret("right-secret"),
      },
    });

    const wrong = await enqueueWebhookRun({
      automationId: automation.id,
      secret: "wrong-secret",
      payload: {},
    });
    const missing = await enqueueWebhookRun({
      automationId: automation.id,
      secret: null,
      payload: {},
    });

    expect(wrong).toEqual({ status: "unauthorized" });
    expect(missing).toEqual({ status: "unauthorized" });
    expect(await db.automationRun.count()).toBe(0);
  });

  it("ignores a valid webhook secret when the Automation is unpublished", async () => {
    const secret = "hook-secret";
    const automation = await db.automation.create({
      data: {
        name: "Draft webhook",
        status: AutomationStatus.DRAFT,
        publishedSnapshot: webhookGraph,
        webhookSecretHash: hashWebhookSecret(secret),
      },
    });

    const result = await enqueueWebhookRun({
      automationId: automation.id,
      secret,
      payload: { hello: "world" },
    });

    expect(result).toEqual({ status: "ignored" });
    expect(await db.automationRun.count()).toBe(0);
  });
});
