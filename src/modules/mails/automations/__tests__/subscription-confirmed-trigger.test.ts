import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { enqueueEventRuns } from "@/modules/automations/lib/automation-events";
import { runDueAutomations } from "@/modules/automations/lib/automation-runner";
import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { createInMemoryEffects } from "@/modules/automations/lib/effects";
import { mergeNodeRegistries } from "@/modules/automations/lib/node-registry";
import { sendEmailNodeRegistry } from "@/modules/mails/automations";
import { db } from "@/shared/lib/db";
import { AutomationRunStatus, AutomationStatus } from "@/generated/prisma";
import { FORM_SUBMITTED_NODE_TYPE } from "@/modules/forms/automations/constants";

import { subscriptionConfirmedTriggerCatalogEntry } from "../catalog";
import {
  SUBSCRIPTION_CONFIRMED_NODE_TYPE,
  SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE,
} from "../constants";
import { subscriptionConfirmedNodeRegistry } from "../node";

vi.mock("@/lib/event-handler", () => ({
  handleUserSubscribed: vi.fn(async () => {}),
}));

vi.mock("@/modules/mails/lib/core", () => ({
  createContactOnProvider: vi.fn(async () => ({ externalId: "test-external" })),
}));

vi.mock("../emit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../emit")>();
  return {
    ...actual,
    emitSubscriptionConfirmed: vi.fn(actual.emitSubscriptionConfirmed),
  };
});

import { newSubscription } from "@/actions/new-subscription";
import { handleUserSubscribed } from "@/lib/event-handler";
import { emitSubscriptionConfirmed } from "../emit";

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

async function createContact(email: string, verified = false) {
  return db.emailContact.create({
    data: {
      email,
      emailVerified: verified ? new Date() : null,
    },
  });
}

async function createToken(email: string) {
  return db.emailSubscriptionToken.create({
    data: {
      email,
      token: randomUUID(),
      expires: new Date(Date.now() + 60 * 60 * 1000),
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
    const contact = await createContact(uniqueEmail());
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
    const contact = await createContact(uniqueEmail());
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
    const contact = await createContact(uniqueEmail());
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

describe("newSubscription confirmation semantics", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupAutomationTables();
  });

  it("emits subscription.confirmed on the first confirmation", async () => {
    const email = uniqueEmail();
    const contact = await createContact(email);
    const token = await createToken(email);
    await publishGraph(subscriptionConfirmedGraph);

    const result = await newSubscription(token.token);

    expect(result).toEqual({ success: "Email verified!" });

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.triggerType).toBe(SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE);
    expect(run.payload).toMatchObject({
      email,
      contactId: contact.id,
      confirmedAt: expect.any(String),
    });
    expect(run.idempotencyKey).toBe(contact.id);

    const updated = await db.emailContact.findUniqueOrThrow({
      where: { id: contact.id },
    });
    expect(updated.emailVerified).not.toBeNull();

    const interaction = await db.emailContactInteraction.findFirst({
      where: { contactId: contact.id, interactionType: "user_subscribed" },
    });
    expect(interaction).not.toBeNull();
    expect(handleUserSubscribed).toHaveBeenCalledTimes(1);
  });

  it("executes the subscription Automation end to end", async () => {
    const email = uniqueEmail();
    const contact = await createContact(email);
    const token = await createToken(email);
    await publishGraph(subscriptionConfirmedGraph);

    await newSubscription(token.token);

    const effects = createInMemoryEffects();
    const now = new Date();
    await runDueAutomations({ now, registry, effects });
    await runDueAutomations({ now, registry, effects });

    const run = await db.automationRun.findFirstOrThrow();
    expect(effects.mailCalls).toHaveLength(1);
    expect(effects.mailCalls[0]).toMatchObject({
      config: { recipient: contact.email },
    });
    expect(run.status).toBe(AutomationRunStatus.COMPLETED);
  });

  it("does not emit or notify when an already verified contact re-confirms", async () => {
    const email = uniqueEmail();
    const contact = await createContact(email, true);
    const token = await createToken(email);
    await publishGraph(subscriptionConfirmedGraph);

    const result = await newSubscription(token.token);

    expect(result).toEqual({ success: "Email verified!" });
    expect(emitSubscriptionConfirmed).not.toHaveBeenCalled();
    expect(handleUserSubscribed).not.toHaveBeenCalled();
    expect(await db.automationRun.count()).toBe(0);

    const interaction = await db.emailContactInteraction.findFirst({
      where: { contactId: contact.id, interactionType: "user_subscribed" },
    });
    expect(interaction).toBeNull();
  });

  it("does not start a form.submitted Automation from a confirmation", async () => {
    const email = uniqueEmail();
    await createContact(email);
    const token = await createToken(email);
    await publishGraph({
      nodes: [
        { id: "form-trigger", type: FORM_SUBMITTED_NODE_TYPE, data: {} },
        {
          id: "send",
          type: "SEND_EMAIL",
          data: {
            recipient: "{{ payload.email }}",
            subject: "Welcome",
            body: "Hi",
          },
        },
      ],
      connections: [{ fromNodeId: "form-trigger", toNodeId: "send" }],
    });

    await newSubscription(token.token);

    expect(await db.automationRun.count()).toBe(0);
  });

  it("never lets an emit failure block the confirmation", async () => {
    const email = uniqueEmail();
    const contact = await createContact(email);
    const token = await createToken(email);
    vi.mocked(emitSubscriptionConfirmed).mockRejectedValueOnce(
      new Error("boom"),
    );

    const result = await newSubscription(token.token);

    expect(result).toEqual({ success: "Email verified!" });
    const updated = await db.emailContact.findUniqueOrThrow({
      where: { id: contact.id },
    });
    expect(updated.emailVerified).not.toBeNull();
  });
});
