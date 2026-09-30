import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import { enqueueEventRuns } from "@/modules/automations/lib/automation-events";
import { runDueAutomations } from "@/modules/automations/lib/automation-runner";
import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { createInMemoryEffects } from "@/modules/automations/lib/effects";
import { mergeNodeRegistries } from "@/modules/automations/lib/node-registry";
import { sendEmailNodeRegistry } from "@/modules/mails/automations";
import { db } from "@/shared/lib/db";
import { AutomationRunStatus, AutomationStatus } from "@/generated/prisma";

import { subscriptionConfirmedTriggerCatalogEntry } from "../catalog";
import {
  SUBSCRIPTION_CONFIRMED_NODE_TYPE,
  SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE,
} from "../constants";
import { subscriptionConfirmedNodeRegistry } from "../node";

const registry = mergeNodeRegistries(
  sendEmailNodeRegistry,
  subscriptionConfirmedNodeRegistry,
);

const subscriptionConfirmedGraph = {
  nodes: [
    {
      id: "subscription-trigger",
      type: SUBSCRIPTION_CONFIRMED_NODE_TYPE,
      data: {},
    },
    {
      id: "send",
      type: "SEND_EMAIL",
      data: {
        recipient: "{{ input.email }}",
        subject: "Subscription confirmed",
        body: "Confirmed at {{ input.confirmedAt }}",
      },
    },
  ],
  connections: [{ fromNodeId: "subscription-trigger", toNodeId: "send" }],
};

function uniqueEmail(): string {
  return `subscriber-${randomUUID()}@example.com`;
}

async function publishGraph(graph: unknown) {
  return db.automation.create({
    data: {
      name: "Subscription nurture",
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: graph as never,
    },
  });
}

describe("subscription.confirmed trigger", () => {
  beforeEach(async () => {
    await cleanupAutomationTables();
  });

  it("offers the trigger in the palette with a passthrough payload shape", () => {
    expect(subscriptionConfirmedTriggerCatalogEntry.type).toBe(
      SUBSCRIPTION_CONFIRMED_NODE_TYPE,
    );
    expect(subscriptionConfirmedTriggerCatalogEntry.label).toBe(
      "New subscription",
    );
    expect(subscriptionConfirmedTriggerCatalogEntry.category).toBe("trigger");
    expect(
      subscriptionConfirmedTriggerCatalogEntry.defaultData,
    ).toMatchObject({
      email: expect.any(String),
      contactId: expect.any(String),
      confirmedAt: expect.any(String),
    });
  });

  it("registers the trigger as a passthrough handler", () => {
    expect(Object.keys(subscriptionConfirmedNodeRegistry)).toContain(
      "subscription_confirmed",
    );
  });

  it("starts a Run when enqueueEventRuns fires with the trigger type", async () => {
    const contact = await db.emailContact.create({
      data: { email: uniqueEmail() },
    });
    await publishGraph(subscriptionConfirmedGraph);
    const now = new Date("2026-09-26T10:00:00.000Z");
    const confirmedAt = now.toISOString();

    const { runIds } = await enqueueEventRuns({
      triggerType: SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE,
      payload: {
        email: contact.email,
        contactId: contact.id,
        confirmedAt,
      },
      idempotencyKey: contact.id,
      now,
    });

    expect(runIds).toHaveLength(1);

    const run = await db.automationRun.findUniqueOrThrow({
      where: { id: runIds[0] },
    });
    expect(run.triggerType).toBe(SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE);
    expect(run.status).toBe(AutomationRunStatus.RUNNING);
    expect(run.payload).toMatchObject({
      email: contact.email,
      contactId: contact.id,
      confirmedAt,
    });
    expect(run.idempotencyKey).toBe(contact.id);
  });

  it("passes the payload through to its successors", async () => {
    const contact = await db.emailContact.create({
      data: { email: uniqueEmail() },
    });
    await publishGraph(subscriptionConfirmedGraph);
    const now = new Date("2026-09-26T10:00:00.000Z");
    const confirmedAt = now.toISOString();

    await enqueueEventRuns({
      triggerType: SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE,
      payload: {
        email: contact.email,
        contactId: contact.id,
        confirmedAt,
      },
      idempotencyKey: contact.id,
      now,
    });

    const effects = createInMemoryEffects();
    await runDueAutomations({ now, registry, effects });
    await runDueAutomations({ now, registry, effects });

    expect(effects.mailCalls).toHaveLength(1);
    expect(effects.mailCalls[0]).toMatchObject({
      config: {
        recipient: contact.email,
        body: `Confirmed at ${confirmedAt}`,
      },
    });
  });

  it("does not start a Run for a different trigger type", async () => {
    const contact = await db.emailContact.create({
      data: { email: uniqueEmail() },
    });
    await publishGraph(subscriptionConfirmedGraph);

    const { runIds } = await enqueueEventRuns({
      triggerType: "form.submitted",
      payload: { email: contact.email },
      idempotencyKey: contact.id,
    });

    expect(runIds).toHaveLength(0);
    expect(await db.automationRun.count()).toBe(0);
  });
});
