import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import {
  AutomationRunStatus,
  AutomationStatus,
  ContentStatus,
  ProductAcquisitionMode,
  ProductType,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import {
  FORM_SUBMITTED_NODE_TYPE,
  FORM_SUBMITTED_TRIGGER_TYPE,
} from "../constants";
import { emitFormSubmitted } from "../emit";

vi.mock("@/lib/recaptcha", () => ({
  verifyRecaptcha: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/event-handler", () => ({
  handleFormSubmitted: vi.fn(async () => {}),
}));

vi.mock("../emit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../emit")>();
  return { ...actual, emitFormSubmitted: vi.fn(actual.emitFormSubmitted) };
});

import { submitProductForm } from "@/actions/submit-product-form";
import { POST as productSubmissionRoute } from "@/app/api/products/[rootId]/submission/route";
import { handleFormSubmitted } from "@/lib/event-handler";

const CONFIGURED_FORM_ID = "form-product";

function uniqueEmail(): string {
  return `product-${randomUUID()}@example.com`;
}

function productGraph(formId: string) {
  return {
    nodes: [
      { id: "form-trigger", type: FORM_SUBMITTED_NODE_TYPE, data: { formId } },
      {
        id: "send",
        type: "SEND_EMAIL",
        data: {
          recipient: "{{ payload.email }}",
          subject: "Thanks for your interest",
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
      name: "Product form nurture",
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: productGraph(formId) as never,
    },
  });
}

async function createFormProduct(formId: string) {
  const root = await db.product.create({
    data: {
      title: "Root product",
      slug: `root-${randomUUID()}`,
      type: ProductType.SERVICE,
      version: 1,
      status: ContentStatus.DRAFT,
      isLatest: false,
      acquisitionMode: ProductAcquisitionMode.FORM,
      formId,
    },
  });

  const publishedAt = new Date();
  const product = await db.product.create({
    data: {
      title: "Form product",
      slug: `form-product-${randomUUID()}`,
      type: ProductType.SERVICE,
      version: 2,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      firstPublishedAt: publishedAt,
      publishedAt,
      acquisitionMode: ProductAcquisitionMode.FORM,
      formId,
      rootId: root.id,
    },
  });

  return { rootId: root.id, product };
}

const validSubmission = (email: string) => ({ name: "Ada", email });

beforeEach(async () => {
  vi.clearAllMocks();
  await cleanupAutomationTables();
  await db.form.upsert({
    where: { id: CONFIGURED_FORM_ID },
    update: {},
    create: { id: CONFIGURED_FORM_ID, name: "Product form" },
  });
});

describe("product form action emit", () => {
  it("starts a Run scoped to the product's form when the form is submitted", async () => {
    const email = uniqueEmail();
    const { rootId } = await createFormProduct(CONFIGURED_FORM_ID);
    await publishGraph(CONFIGURED_FORM_ID);

    const result = await submitProductForm(rootId, validSubmission(email), "token");

    expect(result.success).toBe(true);

    // Behaviour unchanged: the FormSubmission is still persisted.
    const submission = await db.formSubmission.findFirstOrThrow({
      where: { formId: CONFIGURED_FORM_ID, email },
    });
    expect(submission.data).toMatchObject(validSubmission(email));

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.triggerType).toBe(FORM_SUBMITTED_TRIGGER_TYPE);
    expect(run.status).toBe(AutomationRunStatus.RUNNING);
    expect(run.payload).toMatchObject({
      formId: CONFIGURED_FORM_ID,
      email,
      data: validSubmission(email),
    });

    const createdContact = await db.emailContact.findFirstOrThrow({
      where: { email },
    });
    expect(run.idempotencyKey).toBe(createdContact.id);
    expect(handleFormSubmitted).toHaveBeenCalledTimes(1);
  });

  it("does not start a Run for an Automation scoped to a different form", async () => {
    const { rootId } = await createFormProduct(CONFIGURED_FORM_ID);
    await publishGraph("some-other-form");

    await submitProductForm(rootId, validSubmission(uniqueEmail()), "token");

    expect(await db.automationRun.count()).toBe(0);
  });

  it("never lets an emit failure block the submission", async () => {
    const email = uniqueEmail();
    const { rootId } = await createFormProduct(CONFIGURED_FORM_ID);
    vi.mocked(emitFormSubmitted).mockRejectedValueOnce(new Error("boom"));

    const result = await submitProductForm(rootId, validSubmission(email), "token");

    expect(result.success).toBe(true);
    expect(await db.formSubmission.count({ where: { email } })).toBe(1);
  });
});

describe("product submission route emit", () => {
  const makeRequest = (rootId: string, body: unknown) =>
    new Request(`http://localhost/api/products/${rootId}/submission/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("starts a Run scoped to the product's form and creates the contact", async () => {
    const email = uniqueEmail();
    const { rootId } = await createFormProduct(CONFIGURED_FORM_ID);
    await publishGraph(CONFIGURED_FORM_ID);

    const res = await productSubmissionRoute(makeRequest(rootId, validSubmission(email)), {
      params: Promise.resolve({ rootId }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { submissionId: string };
    expect(json.submissionId).toBeTruthy();

    // Behaviour unchanged: the FormSubmission is still persisted.
    const submission = await db.formSubmission.findFirstOrThrow({
      where: { formId: CONFIGURED_FORM_ID, email },
    });
    expect(submission.data).toMatchObject(validSubmission(email));

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.triggerType).toBe(FORM_SUBMITTED_TRIGGER_TYPE);
    expect(run.payload).toMatchObject({
      formId: CONFIGURED_FORM_ID,
      email,
      data: validSubmission(email),
    });

    const createdContact = await db.emailContact.findFirstOrThrow({
      where: { email },
    });
    expect(run.idempotencyKey).toBe(createdContact.id);
  });

  it("does not start a Run for an Automation scoped to a different form", async () => {
    const { rootId } = await createFormProduct(CONFIGURED_FORM_ID);
    await publishGraph("some-other-form");

    await productSubmissionRoute(makeRequest(rootId, validSubmission(uniqueEmail())), {
      params: Promise.resolve({ rootId }),
    });

    expect(await db.automationRun.count()).toBe(0);
  });

  it("still stores an email-less submission without creating a contact or a Run", async () => {
    const { rootId } = await createFormProduct(CONFIGURED_FORM_ID);
    await publishGraph(CONFIGURED_FORM_ID);
    const contactsBefore = await db.emailContact.count();

    const res = await productSubmissionRoute(
      makeRequest(rootId, { name: "Ada" }),
      { params: Promise.resolve({ rootId }) },
    );

    expect(res.status).toBe(200);
    expect(
      await db.formSubmission.findFirst({
        where: { formId: CONFIGURED_FORM_ID, email: null },
      }),
    ).not.toBeNull();
    expect(await db.emailContact.count()).toBe(contactsBefore);
    expect(await db.automationRun.count()).toBe(0);
  });
});
