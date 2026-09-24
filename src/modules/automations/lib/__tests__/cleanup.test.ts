import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import { AutomationStatus } from "@/generated/prisma";
import { cleanupAutomationTables } from "@/modules/automations";

async function countEveryAutomationTable() {
  const [credentials, automations, nodes, connections, runs, steps] =
    await Promise.all([
      db.credential.count(),
      db.automation.count(),
      db.node.count(),
      db.connection.count(),
      db.automationRun.count(),
      db.automationRunStep.count(),
    ]);
  return { credentials, automations, nodes, connections, runs, steps };
}

describe("cleanupAutomationTables", () => {
  beforeEach(async () => {
    await cleanupAutomationTables();
  });

  it("wipes all six automation tables", async () => {
    const credential = await db.credential.create({
      data: { name: "Key", type: "openai", secretEncrypted: "enc:xyz" },
    });
    const automation = await db.automation.create({
      data: { name: "Flow", status: AutomationStatus.PUBLISHED },
    });
    const node = await db.node.create({
      data: {
        automationId: automation.id,
        type: "httpRequest",
        name: "Call",
        position: { x: 1, y: 2 },
        data: {},
        credentialId: credential.id,
      },
    });
    await db.node.create({
      data: {
        automationId: automation.id,
        type: "sendEmail",
        name: "Mail",
        position: { x: 3, y: 4 },
        data: {},
      },
    });
    await db.connection.create({
      data: {
        automationId: automation.id,
        fromNodeId: node.id,
        toNodeId: (
          await db.node.findFirstOrThrow({ where: { type: "sendEmail" } })
        ).id,
      },
    });
    const run = await db.automationRun.create({
      data: {
        automationId: automation.id,
        triggerType: "webhook",
        graph: { nodes: [], connections: [] },
      },
    });
    await db.automationRunStep.create({
      data: { runId: run.id, nodeId: node.id, seq: 1 },
    });

    expect(await countEveryAutomationTable()).toEqual({
      credentials: 1,
      automations: 1,
      nodes: 2,
      connections: 1,
      runs: 1,
      steps: 1,
    });

    await cleanupAutomationTables();

    expect(await countEveryAutomationTable()).toEqual({
      credentials: 0,
      automations: 0,
      nodes: 0,
      connections: 0,
      runs: 0,
      steps: 0,
    });
  });

  it("is idempotent on an empty database", async () => {
    await cleanupAutomationTables();

    expect(await countEveryAutomationTable()).toEqual({
      credentials: 0,
      automations: 0,
      nodes: 0,
      connections: 0,
      runs: 0,
      steps: 0,
    });
  });
});