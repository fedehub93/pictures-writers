import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { AutomationRunStatus, AutomationStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { EbookType } from "@/modules/shop/products/types";

import { BUILT_IN_EBOOK_FORM_ID } from "../../built-in-forms";
import {
  FORM_SUBMITTED_NODE_TYPE,
  FORM_SUBMITTED_TRIGGER_TYPE,
} from "../constants";
import { emitFormSubmitted } from "../emit";

vi.mock("@/lib/recaptcha", () => ({
  verifyRecaptcha: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/event-handler", () => ({
  handleEbookDownloaded: vi.fn(async () => {}),
}));

vi.mock("@/modules/mails/lib/mail", () => ({
  sendFreeEbookEmail: vi.fn(async () => true),
}));

vi.mock("@/modules/mails/lib/core", () => ({
  createContactOnProvider: vi.fn(async () => ({})),
}));

vi.mock("../emit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../emit")>();
  return { ...actual, emitFormSubmitted: vi.fn(actual.emitFormSubmitted) };
});

import { subscribeFreeEbook } from "@/actions/subscribe-free-ebook";
import { handleEbookDownloaded } from "@/lib/event-handler";
import { createContactOnProvider } from "@/modules/mails/lib/core";

function uniqueEmail(): string {
  return `ebook-${randomUUID()}@example.com`;
}

function ebookGraph(formId: string) {
  return {
    nodes: [
      { id: "form-trigger", type: FORM_SUBMITTED_NODE_TYPE, data: { formId } },
      {
        id: "send",
        type: "SEND_EMAIL",
        data: {
          recipient: "{{ payload.email }}",
          subject: "Your free eBook",
          body: "Here is the {{ payload.data.format }} you requested",
        },
      },
    ],
    connections: [{ fromNodeId: "form-trigger", toNodeId: "send" }],
  };
}

async function publishGraph(formId: string) {
  return db.automation.create({
    data: {
      name: "eBook nurture",
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: ebookGraph(formId) as never,
    },
  });
}

const validDownload = (email: string) => ({
  email,
  rootId: "product-root-1",
  format: EbookType.PDF,
});

describe("ebook action emit", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupAutomationTables();
    // The shadow eBook Form is seeded by migration; upsert keeps this test
    // independent of seed state and satisfies the FormSubmission-free FK target.
    await db.form.upsert({
      where: { id: BUILT_IN_EBOOK_FORM_ID },
      update: {},
      create: { id: BUILT_IN_EBOOK_FORM_ID, name: "eBook (interno)" },
    });
  });

  it("starts a Run scoped to the eBook form when the eBook is downloaded", async () => {
    const email = uniqueEmail();
    await publishGraph(BUILT_IN_EBOOK_FORM_ID);

    const result = await subscribeFreeEbook(validDownload(email), "token");

    expect(result.success).toBe(true);

    // Lead capture never writes a FormSubmission row.
    expect(await db.formSubmission.count({ where: { email } })).toBe(0);

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.triggerType).toBe(FORM_SUBMITTED_TRIGGER_TYPE);
    expect(run.status).toBe(AutomationRunStatus.RUNNING);
    // Assert the literal stable id too: importing the constant on both sides
    // would let a wrong constant pass unnoticed.
    expect(run.payload).toMatchObject({
      formId: "built-in-form-ebook",
      email,
      data: { email, rootId: "product-root-1", format: "pdf" },
    });

    const createdContact = await db.emailContact.findFirstOrThrow({
      where: { email },
    });
    expect(run.idempotencyKey).toBe(createdContact.id);
  });

  it("keeps the ebook_downloaded interaction, notification and provider sync", async () => {
    const email = uniqueEmail();
    await publishGraph(BUILT_IN_EBOOK_FORM_ID);

    await subscribeFreeEbook(validDownload(email), "token");

    const createdContact = await db.emailContact.findFirstOrThrow({
      where: { email },
    });
    const interaction = await db.emailContactInteraction.findFirst({
      where: {
        contactId: createdContact.id,
        interactionType: "ebook_downloaded",
      },
    });
    expect(interaction).not.toBeNull();
    expect(handleEbookDownloaded).toHaveBeenCalledTimes(1);
    expect(createContactOnProvider).toHaveBeenCalledWith(createdContact.id);
  });

  it("does not start a Run for an Automation scoped to a different form", async () => {
    await publishGraph("some-other-form");

    await subscribeFreeEbook(validDownload(uniqueEmail()), "token");

    expect(await db.automationRun.count()).toBe(0);
  });

  it("never lets an emit failure block the download", async () => {
    const email = uniqueEmail();
    vi.mocked(emitFormSubmitted).mockRejectedValueOnce(new Error("boom"));

    const result = await subscribeFreeEbook(validDownload(email), "token");

    expect(result.success).toBe(true);
    expect(await db.emailContact.count({ where: { email } })).toBe(1);
  });
});
