import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import {
  AutomationRunStatus,
  AutomationRunStepStatus,
  AutomationStatus,
} from "@/generated/prisma";
import { cleanupAutomationTables } from "@/modules/automations";

const GRAPH_SNAPSHOT = {
  nodes: [
    { id: "n-trigger", type: "manual", name: "Run now" },
    { id: "n-conditional", type: "conditional", name: "Has email?" },
    { id: "n-email", type: "sendEmail", name: "Follow up" },
  ],
  connections: [
    {
      fromNodeId: "n-trigger",
      toNodeId: "n-conditional",
      fromOutput: "main",
      toInput: "main",
    },
    {
      fromNodeId: "n-conditional",
      toNodeId: "n-email",
      fromOutput: "true",
      toInput: "main",
    },
  ],
};

// A published Automation with one Node, one Connection, one Run and one RunStep.
async function seedAutomation() {
  const credential = await db.credential.create({
    data: { name: "SendGrid", type: "sendgrid", secretEncrypted: "enc:v1:abc" },
  });

  const automation = await db.automation.create({
    data: {
      name: "Nurture flow",
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: GRAPH_SNAPSHOT,
      webhookSecretHash: "sha256:def",
    },
  });

  const triggerNode = await db.node.create({
    data: {
      automationId: automation.id,
      type: "manual",
      name: "Run now",
      position: { x: 10, y: 20 },
      data: { label: "Start" },
    },
  });

  const emailNode = await db.node.create({
    data: {
      automationId: automation.id,
      type: "sendEmail",
      name: "Follow up",
      position: { x: 200, y: 20 },
      data: { templateId: "tpl-1" },
      credentialId: credential.id,
    },
  });

  const connection = await db.connection.create({
    data: {
      automationId: automation.id,
      fromNodeId: triggerNode.id,
      toNodeId: emailNode.id,
    },
  });

  const run = await db.automationRun.create({
    data: {
      automationId: automation.id,
      triggerType: "manual",
      graph: GRAPH_SNAPSHOT,
      payload: { formEmail: "reader@example.com" },
      idempotencyKey: "contact-123",
      status: AutomationRunStatus.COMPLETED,
      endedAt: new Date("2026-09-24T10:00:00.000Z"),
    },
  });

  const step = await db.automationRunStep.create({
    data: {
      runId: run.id,
      nodeId: triggerNode.id,
      seq: 1,
      input: { trigger: "manual" },
      output: { ok: true },
      status: AutomationRunStepStatus.COMPLETED,
      attempts: 1,
      endedAt: new Date("2026-09-24T10:00:01.000Z"),
    },
  });

  return {
    credential,
    automation,
    triggerNode,
    emailNode,
    connection,
    run,
    step,
  };
}

describe("automation schema", () => {
  beforeEach(async () => {
    await cleanupAutomationTables();
  });

  it("round-trips an Automation with status, snapshot and webhook secret hash", async () => {
    const { automation, run } = await seedAutomation();

    const found = await db.automation.findUnique({
      where: { id: automation.id },
    });

    expect(found?.name).toBe("Nurture flow");
    expect(found?.status).toBe(AutomationStatus.PUBLISHED);
    expect(found?.publishedSnapshot).toEqual(GRAPH_SNAPSHOT);
    expect(found?.webhookSecretHash).toBe("sha256:def");
    // Runs are reachable from the Automation.
    expect(
      await db.automationRun.count({
        where: { automationId: automation.id },
      }),
    ).toBe(1);
    expect(run.automationId).toBe(automation.id);
  });

  it("stores Node position/data as Json and references a Credential", async () => {
    const { emailNode, credential } = await seedAutomation();

    const found = await db.node.findUnique({
      where: { id: emailNode.id },
      include: { credential: true },
    });

    expect(found?.type).toBe("sendEmail");
    expect(found?.position).toEqual({ x: 200, y: 20 });
    expect(found?.data).toEqual({ templateId: "tpl-1" });
    expect(found?.credentialId).toBe(credential.id);
    expect(found?.credential?.name).toBe("SendGrid");
    // The secret is never returned in plaintext by the column name.
    expect(found?.credential?.secretEncrypted).toBe("enc:v1:abc");
  });

  it("defaults Connection outputs to main and supports named outputs", async () => {
    const { automation, emailNode, connection } = await seedAutomation();

    expect(connection.fromOutput).toBe("main");
    expect(connection.toInput).toBe("main");

    const conditional = await db.node.create({
      data: {
        automationId: automation.id,
        type: "conditional",
        name: "Branch",
        position: { x: 100, y: 100 },
        data: {},
      },
    });

    const trueOut = await db.connection.create({
      data: {
        automationId: automation.id,
        fromNodeId: conditional.id,
        toNodeId: emailNode.id,
        fromOutput: "true",
        toInput: "main",
      },
    });

    const foundTrue = await db.connection.findUnique({
      where: { id: trueOut.id },
    });
    expect(foundTrue?.fromOutput).toBe("true");
    expect(foundTrue?.toInput).toBe("main");
  });

  it("stores a Run with the graph snapshot, payload and idempotency key", async () => {
    const { run } = await seedAutomation();

    const found = await db.automationRun.findUnique({
      where: { id: run.id },
      include: { steps: true },
    });

    expect(found?.triggerType).toBe("manual");
    expect(found?.graph).toEqual(GRAPH_SNAPSHOT);
    expect(found?.payload).toEqual({ formEmail: "reader@example.com" });
    expect(found?.idempotencyKey).toBe("contact-123");
    expect(found?.status).toBe(AutomationRunStatus.COMPLETED);
    expect(found?.endedAt).toEqual(new Date("2026-09-24T10:00:00.000Z"));
    expect(found?.error).toBeNull();
    expect(found?.steps).toHaveLength(1);
  });

  it("stores a Step ledger row with snapshots, status, attempts and resume time", async () => {
    const { run, step, triggerNode } = await seedAutomation();

    await db.automationRunStep.create({
      data: {
        runId: run.id,
        nodeId: triggerNode.id,
        seq: 2,
        status: AutomationRunStepStatus.RUNNING,
        attempts: 2,
        resumeAt: new Date("2026-09-26T10:00:00.000Z"),
      },
    });

    const found = await db.automationRunStep.findUnique({
      where: { id: step.id },
    });

    expect(found?.runId).toBe(run.id);
    expect(found?.nodeId).toBe(triggerNode.id);
    expect(found?.seq).toBe(1);
    expect(found?.input).toEqual({ trigger: "manual" });
    expect(found?.output).toEqual({ ok: true });
    expect(found?.status).toBe(AutomationRunStepStatus.COMPLETED);
    expect(found?.attempts).toBe(1);
    expect(found?.resumeAt).toBeNull();
  });

  it("allows multiple Runs with the same idempotency key (dedup is engine-time)", async () => {
    const { automation } = await seedAutomation();

    // spec.md: the engine skips enqueue when a NON-TERMINAL Run exists with the
    // same (automationId, idempotencyKey). Once a Run is terminal, the same key
    // may start a new cycle — so the DB must not reject a duplicate key.
    await expect(
      db.automationRun.create({
        data: {
          automationId: automation.id,
          triggerType: "manual",
          graph: GRAPH_SNAPSHOT,
          idempotencyKey: "contact-123",
        },
      }),
    ).resolves.toBeTruthy();

    const second = await db.automationRun.create({
      data: {
        automationId: automation.id,
        triggerType: "manual",
        graph: GRAPH_SNAPSHOT,
        idempotencyKey: "contact-123",
      },
    });
    expect(second.id).toBeTruthy();

    // A Run without an idempotency key (cron/manual triggers) coexists freely.
    await expect(
      db.automationRun.create({
        data: {
          automationId: automation.id,
          triggerType: "cron",
          graph: GRAPH_SNAPSHOT,
        },
      }),
    ).resolves.toBeTruthy();
  });

  it("cascades deletions from the Automation down to runs and steps", async () => {
    const { automation, run } = await seedAutomation();

    await db.automation.delete({ where: { id: automation.id } });

    expect(
      await db.automationRun.count({ where: { id: run.id } }),
    ).toBe(0);
    expect(await db.automationRunStep.count({})).toBe(0);
    expect(await db.node.count({})).toBe(0);
    expect(await db.connection.count({})).toBe(0);
  });

  it("detaches (does not delete) a Credential from Nodes on deletion", async () => {
    const { credential, emailNode } = await seedAutomation();

    await db.credential.delete({ where: { id: credential.id } });

    const found = await db.node.findUnique({ where: { id: emailNode.id } });
    expect(found?.credentialId).toBeNull();
  });

  it("defaults new Automations and Runs to their initial status", async () => {
    const automation = await db.automation.create({
      data: { name: "Draft flow" },
    });
    const run = await db.automationRun.create({
      data: {
        automationId: automation.id,
        triggerType: "webhook",
        graph: {},
      },
    });
    const step = await db.automationRunStep.create({
      data: { runId: run.id, nodeId: "n-1", seq: 1 },
    });

    expect(automation.status).toBe(AutomationStatus.DRAFT);
    expect(automation.publishedSnapshot).toBeNull();
    expect(automation.webhookSecretHash).toBeNull();
    expect(run.status).toBe(AutomationRunStatus.RUNNING);
    expect(run.payload).toBeNull();
    expect(run.idempotencyKey).toBeNull();
    expect(run.endedAt).toBeNull();
    expect(step.status).toBe(AutomationRunStepStatus.PENDING);
    expect(step.attempts).toBe(0);
  });
});