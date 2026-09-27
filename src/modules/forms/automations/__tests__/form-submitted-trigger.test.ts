import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import { runDueAutomations } from "@/modules/automations/lib/automation-runner";
import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { createInMemoryEffects } from "@/modules/automations/lib/effects";
import { mergeNodeRegistries } from "@/modules/automations/lib/node-registry";
import { sendEmailNodeRegistry } from "@/modules/mails/automations";
import { db } from "@/shared/lib/db";
import { AutomationRunStatus, AutomationStatus } from "@/generated/prisma";

import { formSubmittedTriggerCatalogEntry } from "../catalog";
import { FORM_SUBMITTED_NODE_TYPE, FORM_SUBMITTED_TRIGGER_TYPE } from "../constants";
import { emitFormSubmitted } from "../emit";
import { formSubmittedNodeRegistry } from "../node";

const registry = mergeNodeRegistries(
  sendEmailNodeRegistry,
  formSubmittedNodeRegistry,
);

const formSubmittedGraph = {
  nodes: [
    { id: "form-trigger", type: FORM_SUBMITTED_NODE_TYPE, data: {} },
    {
      id: "send",
      type: "SEND_EMAIL",
      data: {
        recipient: "{{ payload.email }}",
        subject: "Thanks for reaching out",
        body: "Hi {{ payload.data.name }}",
      },
    },
  ],
  connections: [{ fromNodeId: "form-trigger", toNodeId: "send" }],
};

function uniqueEmail(): string {
  return `responder-${randomUUID()}@example.com`;
}

async function publishGraph(graph: unknown) {
  return db.automation.create({
    data: {
      name: "Nurture flow",
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: graph as never,
    },
  });
}

describe("form.submitted trigger", () => {
  beforeEach(async () => {
    await cleanupAutomationTables();
  });

  it("offers the trigger in the palette with a sensible default payload shape", () => {
    expect(formSubmittedTriggerCatalogEntry.type).toBe(FORM_SUBMITTED_NODE_TYPE);
    expect(formSubmittedTriggerCatalogEntry.category).toBe("trigger");
    expect(formSubmittedTriggerCatalogEntry.defaultData).toMatchObject({
      formId: expect.anything(),
      email: expect.anything(),
      data: expect.anything(),
    });
  });

  it("starts a Run whose payload carries the submitted data and responder email", async () => {
    const contact = await db.emailContact.create({
      data: { email: uniqueEmail() },
    });
    await publishGraph(formSubmittedGraph);
    const now = new Date("2026-09-26T10:00:00.000Z");

    const { runIds } = await emitFormSubmitted({
      formId: "form-1",
      email: contact.email,
      contactId: contact.id,
      data: { name: "Ada", tier: "pro" },
      submittedAt: now,
      now,
    });

    expect(runIds).toHaveLength(1);

    const run = await db.automationRun.findUniqueOrThrow({
      where: { id: runIds[0] },
    });
    expect(run.triggerType).toBe(FORM_SUBMITTED_TRIGGER_TYPE);
    expect(run.status).toBe(AutomationRunStatus.RUNNING);
    expect(run.payload).toMatchObject({
      formId: "form-1",
      email: contact.email,
      data: { name: "Ada", tier: "pro" },
    });
    expect(run.idempotencyKey).toBe(contact.id);
  });

  it("does not start a second Run for the same contact while the first is non-terminal", async () => {
    const contact = await db.emailContact.create({
      data: { email: uniqueEmail() },
    });
    await publishGraph(formSubmittedGraph);

    const first = await emitFormSubmitted({
      formId: "form-1",
      email: contact.email,
      contactId: contact.id,
      data: { name: "Ada" },
    });
    const second = await emitFormSubmitted({
      formId: "form-2",
      email: contact.email,
      contactId: contact.id,
      data: { name: "Ada again" },
    });

    expect(second.runIds).toEqual(first.runIds);
    expect(await db.automationRun.count()).toBe(1);
  });

  it("never starts a Run for an unpublished Automation", async () => {
    const contact = await db.emailContact.create({
      data: { email: uniqueEmail() },
    });
    await db.automation.create({
      data: {
        name: "Draft flow",
        status: AutomationStatus.DRAFT,
        publishedSnapshot: formSubmittedGraph,
      },
    });

    const { runIds } = await emitFormSubmitted({
      formId: "form-1",
      email: contact.email,
      contactId: contact.id,
      data: { name: "Ada" },
    });

    expect(runIds).toHaveLength(0);
    expect(await db.automationRun.count()).toBe(0);
  });

  it("proves the no-double-send behaviour end to end", async () => {
    const contact = await db.emailContact.create({
      data: { email: uniqueEmail() },
    });
    await publishGraph(formSubmittedGraph);

    await emitFormSubmitted({
      formId: "form-1",
      email: contact.email,
      contactId: contact.id,
      data: { name: "Ada" },
    });
    await emitFormSubmitted({
      formId: "form-1",
      email: contact.email,
      contactId: contact.id,
      data: { name: "Ada" },
    });

    const effects = createInMemoryEffects();
    const now = new Date("2026-09-26T10:00:00.000Z");
    await runDueAutomations({ now, registry, effects });
    await runDueAutomations({ now, registry, effects });

    expect(effects.mailCalls).toHaveLength(1);
    expect(await db.automationRun.count()).toBe(1);

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.status).toBe(AutomationRunStatus.COMPLETED);
  });
});
