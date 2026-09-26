import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EmailProvider } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { cleanupAutomationTables } from "@/modules/automations";
import { enqueueRun } from "@/modules/automations/lib/automation-ingestion";
import { runDueAutomations } from "@/modules/automations/lib/automation-runner";
import { createInMemoryEffects } from "@/modules/automations/lib/effects";
import {
  createAutomationMailEffect,
  sendEmailNodeRegistry,
} from "@/modules/mails/automations";

const sendEmailGraph = {
  nodes: [
    { id: "trigger", type: "MANUAL_TRIGGER", data: {} },
    {
      id: "email",
      type: "SEND_EMAIL",
      data: {
        recipient: "{{ payload.email }}",
        subject: "Welcome {{ payload.name }}",
        body: "<p>Hi {{ input.name }}, welcome.</p>",
      },
    },
  ],
  connections: [{ fromNodeId: "trigger", toNodeId: "email" }],
};

async function resetTables() {
  await cleanupAutomationTables();
  await db.emailSendLog.deleteMany({});
  await db.emailSetting.deleteMany({});
}

describe("Send Email node", () => {
  beforeEach(resetTables);
  afterEach(resetTables);

  it("runs from the mails registry and sends through the in-memory recorder", async () => {
    const automation = await db.automation.create({
      data: {
        name: "Nurture",
        status: "PUBLISHED",
        publishedSnapshot: sendEmailGraph,
      },
    });

    const run = await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload: { email: "reader@example.com", name: "Ada" },
    });
    const effects = createInMemoryEffects();

    await runDueAutomations({ registry: sendEmailNodeRegistry, effects });
    await runDueAutomations({ registry: sendEmailNodeRegistry, effects });

    expect(effects.mailCalls).toHaveLength(1);
    expect(effects.mailCalls[0]).toMatchObject({
      runId: run!.id,
      config: {
        recipient: "reader@example.com",
        subject: "Welcome Ada",
        body: "<p>Hi Ada, welcome.</p>",
      },
    });

    const emailStep = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "email" },
    });
    expect(emailStep).toMatchObject({
      status: "COMPLETED",
      attempts: 1,
    });
    expect(emailStep?.output).toMatchObject({
      config: { recipient: "reader@example.com" },
    });
  });

  it("retries a transient failure and still sends exactly once", async () => {
    await db.emailSetting.create({
      data: {
        emailSender: "sender@example.com",
        emailProvider: EmailProvider.RESEND,
        emailApiKey: "test-key",
      },
    });
    const automation = await db.automation.create({
      data: {
        name: "Nurture retry",
        status: "PUBLISHED",
        publishedSnapshot: sendEmailGraph,
      },
    });

    const start = new Date("2026-09-25T12:00:00.000Z");
    const run = await enqueueRun(
      {
        automationId: automation.id,
        triggerType: "manual",
        payload: { email: "reader@example.com", name: "Ada" },
      },
      start,
    );

    let attempts = 0;
    const delivered: string[] = [];
    const effect = createAutomationMailEffect({
      transport: async (email) => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("network unavailable");
        }
        delivered.push(email.to);
        return true;
      },
    });
    const effects = {
      ...createInMemoryEffects(),
      mail: effect,
    };

    await runDueAutomations({
      now: start,
      registry: sendEmailNodeRegistry,
      effects,
    });
    await runDueAutomations({
      now: start,
      registry: sendEmailNodeRegistry,
      effects,
    });

    const retried = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "email" },
    });
    expect(retried).toMatchObject({ status: "PENDING", attempts: 1 });

    await runDueAutomations({
      now: new Date(start.getTime() + 5 * 60 * 1000 + 1000),
      registry: sendEmailNodeRegistry,
      effects,
    });

    const completed = await db.automationRun.findUnique({
      where: { id: run!.id },
      include: { steps: true },
    });
    expect(attempts).toBe(2);
    expect(delivered).toEqual(["reader@example.com"]);
    expect(await db.emailSendLog.count()).toBe(1);
    expect(completed?.status).toBe("COMPLETED");
  });
});
