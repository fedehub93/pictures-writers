import { beforeEach, describe, expect, it } from "vitest";

import { AutomationRunStatus, AutomationStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { enqueueRun } from "@/modules/automations/lib/automation-ingestion";
import { createInMemoryEffects } from "@/modules/automations/lib/effects";
import { sendEmailNodeRegistry } from "@/modules/mails/automations";

import { pumpDueAutomations } from "../automation-runtime";

const chainGraph = {
  nodes: [
    { id: "trigger", type: "MANUAL_TRIGGER", data: {} },
    {
      id: "email",
      type: "SEND_EMAIL",
      data: {
        recipient: "{{ payload.email }}",
        subject: "Hi {{ payload.name }}",
        body: "<p>Hello</p>",
      },
    },
    { id: "end", type: "end", data: {} },
  ],
  connections: [
    { fromNodeId: "trigger", toNodeId: "email" },
    { fromNodeId: "email", toNodeId: "end" },
  ],
};

describe("pumpDueAutomations", () => {
  beforeEach(async () => {
    await cleanupAutomationTables();
  });

  it("drains a whole chain in a single call", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Manual chain",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: chainGraph,
      },
    });
    const run = await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload: { email: "reader@example.com", name: "Ada" },
    });
    const effects = createInMemoryEffects();

    const result = await pumpDueAutomations({
      registry: sendEmailNodeRegistry,
      effects,
    });

    expect(result.batches).toBeGreaterThanOrEqual(2);
    expect(effects.mailCalls).toHaveLength(1);
    expect(effects.mailCalls[0]).toMatchObject({
      run: { id: run!.id, triggerType: "manual" },
      config: { recipient: "reader@example.com", subject: "Hi Ada" },
    });

    const completed = await db.automationRun.findUnique({
      where: { id: run!.id },
      include: { steps: true },
    });
    expect(completed?.status).toBe(AutomationRunStatus.COMPLETED);
    expect(completed?.steps).toHaveLength(3);
  });

  it("stops at a wait step without spinning", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Wait chain",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: {
          nodes: [
            { id: "trigger", type: "manual", data: {} },
            { id: "wait", type: "wait", data: { delayMs: 60_000 } },
            { id: "end", type: "end", data: {} },
          ],
          connections: [
            { fromNodeId: "trigger", toNodeId: "wait" },
            { fromNodeId: "wait", toNodeId: "end" },
          ],
        },
      },
    });
    const now = new Date("2026-09-25T12:00:00.000Z");
    const run = await enqueueRun(
      { automationId: automation.id, triggerType: "manual" },
      now,
    );

    const result = await pumpDueAutomations({ now });

    expect(result.processed).toBeGreaterThan(0);
    const waiting = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "wait" },
    });
    expect(waiting?.resumeAt?.getTime()).toBeGreaterThan(now.getTime());

    const parked = await db.automationRun.findUnique({
      where: { id: run!.id },
    });
    expect(parked?.status).toBe(AutomationRunStatus.RUNNING);
  });
});
