import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { AutomationRunStatus, AutomationStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { BUILT_IN_CONTACT_FORM_ID } from "../../built-in-forms";
import {
  FORM_SUBMITTED_NODE_TYPE,
  FORM_SUBMITTED_TRIGGER_TYPE,
} from "../constants";
import { emitFormSubmitted } from "../emit";

vi.mock("@/lib/recaptcha", () => ({
  verifyRecaptcha: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/event-handler", () => ({
  handleContactRequested: vi.fn(async () => {}),
  handleFormSubmitted: vi.fn(async () => {}),
}));

vi.mock("../emit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../emit")>();
  return { ...actual, emitFormSubmitted: vi.fn(actual.emitFormSubmitted) };
});

import { contact } from "@/actions/contact";
import {
  handleContactRequested,
  handleFormSubmitted,
} from "@/lib/event-handler";

function uniqueEmail(): string {
  return `contact-${randomUUID()}@example.com`;
}

function contactGraph(formId: string) {
  return {
    nodes: [
      { id: "form-trigger", type: FORM_SUBMITTED_NODE_TYPE, data: { formId } },
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
}

async function publishGraph(formId: string) {
  return db.automation.create({
    data: {
      name: "Contact nurture",
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: contactGraph(formId) as never,
    },
  });
}

const validSubmission = (email: string) => ({
  name: "Ada",
  email,
  subject: "Hello",
  message: "I would like to know more",
});

describe("contact action emit", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupAutomationTables();
    // The contact form is the existing dynamic form selected by `/contatti`;
    // in the fresh test DB it is not seeded, so make sure the FK target exists.
    await db.form.upsert({
      where: { id: BUILT_IN_CONTACT_FORM_ID },
      update: {},
      create: { id: BUILT_IN_CONTACT_FORM_ID, name: "Contatti" },
    });
  });

  it("starts a Run scoped to the contact form when the home contact form is submitted", async () => {
    const email = uniqueEmail();
    await publishGraph(BUILT_IN_CONTACT_FORM_ID);

    const result = await contact(validSubmission(email), "token");

    expect(result.success).toBe(true);

    // Behaviour unchanged: the FormSubmission is still persisted.
    const submission = await db.formSubmission.findFirstOrThrow({
      where: { formId: BUILT_IN_CONTACT_FORM_ID, email },
    });
    expect(submission.data).toMatchObject({
      name: "Ada",
      email,
      subject: "Hello",
      message: "I would like to know more",
    });

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.triggerType).toBe(FORM_SUBMITTED_TRIGGER_TYPE);
    expect(run.status).toBe(AutomationRunStatus.RUNNING);
    expect(run.payload).toMatchObject({
      formId: BUILT_IN_CONTACT_FORM_ID,
      email,
      data: {
        name: "Ada",
        email,
        subject: "Hello",
        message: "I would like to know more",
      },
    });

    const createdContact = await db.emailContact.findFirstOrThrow({
      where: { email },
    });
    expect(run.idempotencyKey).toBe(createdContact.id);
  });

  it("keeps the CONTACT_REQUESTED notification and does not add FORM_SUBMITTED", async () => {
    const email = uniqueEmail();
    await publishGraph(BUILT_IN_CONTACT_FORM_ID);

    await contact(validSubmission(email), "token");

    expect(handleContactRequested).toHaveBeenCalledTimes(1);
    expect(handleFormSubmitted).not.toHaveBeenCalled();
  });

  it("does not start a Run for an Automation scoped to a different form", async () => {
    await publishGraph("some-other-form");

    await contact(validSubmission(uniqueEmail()), "token");

    expect(await db.automationRun.count()).toBe(0);
  });

  it("never lets an emit failure block the submission", async () => {
    const email = uniqueEmail();
    vi.mocked(emitFormSubmitted).mockRejectedValueOnce(new Error("boom"));

    const result = await contact(validSubmission(email), "token");

    expect(result.success).toBe(true);
    expect(await db.formSubmission.count({ where: { email } })).toBe(1);
  });
});
