import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { runDueAutomations } from "@/modules/automations/lib/automation-runner";
import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { createInMemoryEffects } from "@/modules/automations/lib/effects";
import { mergeNodeRegistries } from "@/modules/automations/lib/node-registry";
import { sendEmailNodeRegistry } from "@/modules/mails/automations";
import { AutomationRunStatus, AutomationStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { BUILT_IN_NEWSLETTER_FORM_ID } from "../../built-in-forms";
import {
  FORM_SUBMITTED_NODE_TYPE,
  FORM_SUBMITTED_TRIGGER_TYPE,
} from "../constants";
import { emitFormSubmitted } from "../emit";
import { formSubmittedNodeRegistry } from "../node";

vi.mock("@/lib/recaptcha", () => ({
  verifyRecaptcha: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/event-handler", () => ({
  handleUserSubscribed: vi.fn(async () => {}),
}));

vi.mock("@/modules/mails/lib/mail", () => ({
  sendSubscriptionEmail: vi.fn(async () => true),
}));

vi.mock("../emit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../emit")>();
  return { ...actual, emitFormSubmitted: vi.fn(actual.emitFormSubmitted) };
});

import { subscribe } from "@/actions/subscribe";
import { handleUserSubscribed } from "@/lib/event-handler";

function uniqueEmail(): string {
  return `newsletter-${randomUUID()}@example.com`;
}

function newsletterGraph(formId: string) {
  return {
    nodes: [
      { id: "form-trigger", type: FORM_SUBMITTED_NODE_TYPE, data: { formId } },
      {
        id: "send",
        type: "SEND_EMAIL",
        data: {
          recipient: "{{ payload.email }}",
          subject: "Welcome aboard",
          body: "Thanks {{ payload.data.email }}",
        },
      },
    ],
    connections: [{ fromNodeId: "form-trigger", toNodeId: "send" }],
  };
}

async function publishGraph(formId: string) {
  return db.automation.create({
    data: {
      name: "Newsletter nurture",
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: newsletterGraph(formId) as never,
    },
  });
}

const registry = mergeNodeRegistries(
  sendEmailNodeRegistry,
  formSubmittedNodeRegistry,
);

describe("newsletter action emit", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupAutomationTables();
    // The shadow newsletter Form is seeded by migration; upsert keeps this test
    // independent of seed state and satisfies the FormSubmission-free FK target.
    await db.form.upsert({
      where: { id: BUILT_IN_NEWSLETTER_FORM_ID },
      update: {},
      create: { id: BUILT_IN_NEWSLETTER_FORM_ID, name: "Newsletter (interno)" },
    });
  });

  it("starts a Run scoped to the newsletter form when the newsletter is submitted", async () => {
    const email = uniqueEmail();
    await publishGraph(BUILT_IN_NEWSLETTER_FORM_ID);

    const result = await subscribe({ email }, "token");

    expect(result.success).toBe(true);

    // Lead capture never writes a FormSubmission row.
    expect(
      await db.formSubmission.count({ where: { email } }),
    ).toBe(0);

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.triggerType).toBe(FORM_SUBMITTED_TRIGGER_TYPE);
    expect(run.status).toBe(AutomationRunStatus.RUNNING);
    // Assert the literal stable id too: importing the constant on both sides
    // would let a wrong constant pass unnoticed.
    expect(run.payload).toMatchObject({
      formId: "built-in-form-newsletter",
      email,
      data: { email },
    });

    const createdContact = await db.emailContact.findFirstOrThrow({
      where: { email },
    });
    expect(run.idempotencyKey).toBe(createdContact.id);
  });

  it("executes the scoped Automation end to end", async () => {
    const email = uniqueEmail();
    await publishGraph(BUILT_IN_NEWSLETTER_FORM_ID);

    await subscribe({ email }, "token");

    const effects = createInMemoryEffects();
    const now = new Date();
    // The runner drains one node per call: the first processes the trigger and
    // schedules the send, the second executes it.
    await runDueAutomations({ now, registry, effects });
    await runDueAutomations({ now, registry, effects });

    expect(effects.mailCalls).toHaveLength(1);
    const run = await db.automationRun.findFirstOrThrow();
    expect(run.status).toBe(AutomationRunStatus.COMPLETED);
  });

  it("keeps the user_subscribed interaction and notification", async () => {
    const email = uniqueEmail();
    await publishGraph(BUILT_IN_NEWSLETTER_FORM_ID);

    await subscribe({ email }, "token");

    const createdContact = await db.emailContact.findFirstOrThrow({
      where: { email },
    });
    const interaction = await db.emailContactInteraction.findFirst({
      where: { contactId: createdContact.id, interactionType: "user_subscribed" },
    });
    expect(interaction).not.toBeNull();
    expect(handleUserSubscribed).toHaveBeenCalledTimes(1);
  });

  it("does not start a Run for an Automation scoped to a different form", async () => {
    await publishGraph("some-other-form");

    await subscribe({ email: uniqueEmail() }, "token");

    expect(await db.automationRun.count()).toBe(0);
  });

  it("never lets an emit failure block the subscription", async () => {
    const email = uniqueEmail();
    vi.mocked(emitFormSubmitted).mockRejectedValueOnce(new Error("boom"));

    const result = await subscribe({ email }, "token");

    expect(result.success).toBe(true);
    expect(await db.emailContact.count({ where: { email } })).toBe(1);
  });
});
