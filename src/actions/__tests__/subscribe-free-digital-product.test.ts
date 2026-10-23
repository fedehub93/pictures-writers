import { randomUUID } from "node:crypto";

import { endOfMonth, startOfMonth } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { submissionsMetric } from "@/modules/forms/submissions/server/metrics";
import { ebooksMetric } from "@/modules/mails/contacts/server/metrics";
import {
  AutomationStatus,
  EmailProvider,
  ProductAcquisitionMode,
  ProductType,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { createProductRoot } from "@/modules/shop/products/lib/__tests__/root-fixtures";
import {
  FORM_SUBMITTED_NODE_TYPE,
  FORM_SUBMITTED_TRIGGER_TYPE,
} from "@/modules/forms/automations/constants";

vi.mock("@/lib/recaptcha", () => ({
  verifyRecaptcha: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/event-handler", () => ({
  handleDigitalDownloaded: vi.fn(async () => {}),
}));

vi.mock("@/modules/mails/lib/mail", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/mails/lib/mail")>();
  return { ...actual, sendEmail: vi.fn(async () => true) };
});

vi.mock("@/modules/mails/lib/core", () => ({
  createContactOnProvider: vi.fn(async () => ({})),
}));

import { subscribeFreeDigitalProduct } from "@/actions/subscribe-free-digital-product";
import { handleDigitalDownloaded } from "@/lib/event-handler";
import { sendEmail } from "@/modules/mails/lib/mail";
import { createContactOnProvider } from "@/modules/mails/lib/core";

const productIds: string[] = [];
const emails: string[] = [];
const formIds: string[] = [];
const mediaIds: string[] = [];
const templateIds: string[] = [];

const DOWNLOAD_TEMPLATE = [
  "<p>{{title}}</p>",
  '<a href="{{{downloadUrl}}}">Download {{format}}</a>',
  '<img src="{{imageCoverUrl}}" alt="{{slug}}" />',
].join("");

function uniqueEmail(): string {
  const email = `download-${randomUUID()}@example.com`;
  emails.push(email);
  return email;
}

const ebookMetadata = (url: string) => ({
  type: "EBOOK",
  formats: [{ type: "pdf", url, size: 1024, pages: 12 }],
  edition: "First",
  publishedAt: null,
  author: null,
});

async function createDownloadForm(interactionType = "workbook_downloaded") {
  const form = await db.form.create({
    data: {
      name: `Lead magnet ${randomUUID()}`,
      interactionType,
    },
  });
  formIds.push(form.id);
  return form;
}

async function createEbookProduct(formId: string | null) {
  const { root, version } = await createProductRoot({
    type: ProductType.EBOOK,
    acquisitionMode: ProductAcquisitionMode.FORM,
    formId,
    title: "Workbook gratuito",
  });
  productIds.push(root.id);

  const cover = await db.media.create({
    data: {
      name: "cover",
      url: `https://cdn.test/${randomUUID()}.jpg`,
    },
  });
  mediaIds.push(cover.id);

  await db.productVersion.update({
    where: { id: version.id },
    data: {
      metadata: ebookMetadata(`https://cdn.test/${randomUUID()}.pdf`) as never,
      imageCoverId: cover.id,
    },
  });

  return { root, version, cover };
}

async function configureDeliveryTemplate({
  withTemplate = true,
}: { withTemplate?: boolean } = {}) {
  let templateId: string | null = null;

  if (withTemplate) {
    const template = await db.emailTemplate.create({
      data: {
        name: `Free download ${randomUUID()}`,
        bodyHtml: DOWNLOAD_TEMPLATE,
      },
    });
    templateId = template.id;
    templateIds.push(template.id);
  }

  await db.emailSetting.create({
    data: {
      emailSender: "hello@example.com",
      emailSenderName: "Pictures Writers",
      emailProvider: EmailProvider.SENDGRID,
      freeDigitalDownloadTemplateId: templateId,
    },
  });
}

const validDownload = (rootId: string, email: string) => ({
  rootId,
  email,
  privacyConsent: true,
});

function publishFormAutomation(formId: string) {
  return db.automation.create({
    data: {
      name: "Workbook nurture",
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: {
        nodes: [
          {
            id: "form-trigger",
            type: FORM_SUBMITTED_NODE_TYPE,
            data: { formId },
          },
        ],
        connections: [],
      } as never,
    },
  });
}

beforeEach(async () => {
  vi.clearAllMocks();
  productIds.length = 0;
  emails.length = 0;
  formIds.length = 0;
  mediaIds.length = 0;
  templateIds.length = 0;

  await cleanupAutomationTables();
  await db.emailSetting.deleteMany({});
});

afterEach(async () => {
  await cleanupAutomationTables();
  await db.emailSetting.deleteMany({});
  if (templateIds.length > 0) {
    await db.emailTemplate.deleteMany({ where: { id: { in: templateIds } } });
  }
  if (formIds.length > 0) {
    await db.formSubmission.deleteMany({
      where: { formId: { in: formIds } },
    });
    await db.form.deleteMany({ where: { id: { in: formIds } } });
  }
  if (productIds.length > 0) {
    await db.productRoot.deleteMany({ where: { id: { in: productIds } } });
  }
  if (mediaIds.length > 0) {
    await db.media.deleteMany({ where: { id: { in: mediaIds } } });
  }
  if (emails.length > 0) {
    await db.emailContact.deleteMany({ where: { email: { in: emails } } });
  }
});

describe("subscribeFreeDigitalProduct", () => {
  it("records the download, notifies admins and delivers the product", async () => {
    const email = uniqueEmail();
    const form = await createDownloadForm();
    const { root, version, cover } = await createEbookProduct(form.id);
    await configureDeliveryTemplate();
    await publishFormAutomation(form.id);

    const result = await subscribeFreeDigitalProduct(
      validDownload(root.id, email),
      "token",
    );

    expect(result.success).toBe(true);

    const submission = await db.formSubmission.findFirstOrThrow({
      where: { formId: form.id, email },
    });
    expect(submission.data).toMatchObject({
      email,
      rootId: root.id,
      privacyConsent: true,
    });

    const contact = await db.emailContact.findFirstOrThrow({
      where: { email },
    });
    const interaction = await db.emailContactInteraction.findFirst({
      where: {
        contactId: contact.id,
        interactionType: "workbook_downloaded",
      },
    });
    expect(interaction).not.toBeNull();

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.triggerType).toBe(FORM_SUBMITTED_TRIGGER_TYPE);
    expect(run.payload).toMatchObject({ formId: form.id, email });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(sendEmail).mock.calls[0][0];
    expect(sent.to).toBe(email);
    expect(sent.html).toContain("Workbook gratuito");
    expect(sent.html).toContain(
      `/api/products/download?id=${root.id}&format=pdf`,
    );
    expect(sent.html).toContain(cover.url);

    expect(handleDigitalDownloaded).toHaveBeenCalledTimes(1);
    expect(createContactOnProvider).toHaveBeenCalledWith(contact.id);

    expect(version.title).toBe("Workbook gratuito");
  });

  it("rejects a product that is not linked to a form", async () => {
    const email = uniqueEmail();
    const { root } = await createEbookProduct(null);
    await configureDeliveryTemplate();

    const result = await subscribeFreeDigitalProduct(
      validDownload(root.id, email),
      "token",
    );

    expect(result.success).toBe(false);
    expect(await db.formSubmission.count({ where: { email } })).toBe(0);
    expect(await db.emailContact.count({ where: { email } })).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(handleDigitalDownloaded).not.toHaveBeenCalled();
  });

  it("fails without recording the download when the provider rejects the send", async () => {
    const email = uniqueEmail();
    const form = await createDownloadForm();
    const { root } = await createEbookProduct(form.id);
    await configureDeliveryTemplate();
    vi.mocked(sendEmail).mockResolvedValueOnce(false);

    const result = await subscribeFreeDigitalProduct(
      validDownload(root.id, email),
      "token",
    );

    expect(result.success).toBe(false);
    expect(await db.formSubmission.count({ where: { email } })).toBe(0);
    expect(await db.emailContact.count({ where: { email } })).toBe(0);
    expect(handleDigitalDownloaded).not.toHaveBeenCalled();
  });

  it("fails without writing a submission when the delivery template is missing", async () => {
    const email = uniqueEmail();
    const form = await createDownloadForm();
    const { root } = await createEbookProduct(form.id);
    await configureDeliveryTemplate({ withTemplate: false });

    const result = await subscribeFreeDigitalProduct(
      validDownload(root.id, email),
      "token",
    );

    expect(result.success).toBe(false);
    expect(await db.formSubmission.count({ where: { email } })).toBe(0);
    expect(await db.emailContact.count({ where: { email } })).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("is safe when the same contact downloads the same product twice", async () => {
    const email = uniqueEmail();
    const form = await createDownloadForm();
    const { root } = await createEbookProduct(form.id);
    await configureDeliveryTemplate();

    const first = await subscribeFreeDigitalProduct(
      validDownload(root.id, email),
      "token",
    );
    const second = await subscribeFreeDigitalProduct(
      validDownload(root.id, email),
      "token",
    );

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);

    const contact = await db.emailContact.findFirstOrThrow({
      where: { email },
    });
    expect(
      await db.emailContactInteraction.count({
        where: {
          contactId: contact.id,
          interactionType: "workbook_downloaded",
        },
      }),
    ).toBe(1);
    expect(await db.formSubmission.count({ where: { email } })).toBe(2);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("rejects a submission without privacy consent", async () => {
    const email = uniqueEmail();
    const form = await createDownloadForm();
    const { root } = await createEbookProduct(form.id);
    await configureDeliveryTemplate();

    const result = await subscribeFreeDigitalProduct(
      { rootId: root.id, email, privacyConsent: false },
      "token",
    );

    expect(result.success).toBe(false);
    expect(await db.formSubmission.count({ where: { email } })).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("does not start a Run for an automation scoped to another form", async () => {
    const email = uniqueEmail();
    const form = await createDownloadForm();
    const { root } = await createEbookProduct(form.id);
    await configureDeliveryTemplate();
    await publishFormAutomation("some-other-form");

    const result = await subscribeFreeDigitalProduct(
      validDownload(root.id, email),
      "token",
    );

    expect(result.success).toBe(true);
    expect(await db.automationRun.count()).toBe(0);
  });

  it("keeps the existing free ebook working through the generic form", async () => {
    const email = uniqueEmail();
    const form = await db.form.findUniqueOrThrow({
      where: { id: "free-ebook-download" },
    });
    const { root } = await createEbookProduct(form.id);
    await configureDeliveryTemplate();
    await publishFormAutomation(form.id);

    const from = startOfMonth(new Date());
    const to = endOfMonth(new Date());
    const before = await ebooksMetric.timeSeries(from, to);

    const result = await subscribeFreeDigitalProduct(
      validDownload(root.id, email),
      "token",
    );

    expect(result.success).toBe(true);
    expect(
      await db.formSubmission.count({ where: { formId: form.id, email } }),
    ).toBe(1);

    const contact = await db.emailContact.findFirstOrThrow({
      where: { email },
    });
    expect(
      await db.emailContactInteraction.count({
        where: {
          contactId: contact.id,
          interactionType: "ebook_downloaded",
        },
      }),
    ).toBe(1);

    // The legacy `ebooks` metric is preserved as the unique-contact view.
    const after = await ebooksMetric.timeSeries(from, to);
    expect(after.total).toBe(before.total + 1);

    // The existing ebook's nurture sequence follows the new linked form.
    const run = await db.automationRun.findFirstOrThrow();
    expect(run.payload).toMatchObject({ formId: form.id, email });
  });

  it("shows downloads in the Form submissions metric, scoped by linked form", async () => {
    const firstForm = await createDownloadForm("workbook_downloaded");
    const secondForm = await createDownloadForm("template_downloaded");
    const first = await createEbookProduct(firstForm.id);
    const second = await createEbookProduct(secondForm.id);
    await configureDeliveryTemplate();

    await subscribeFreeDigitalProduct(
      validDownload(first.root.id, uniqueEmail()),
      "token",
    );
    await subscribeFreeDigitalProduct(
      validDownload(second.root.id, uniqueEmail()),
      "token",
    );

    const from = startOfMonth(new Date());
    const to = endOfMonth(new Date());

    const allDownloads = await submissionsMetric.timeSeries(from, to, {
      formIds: [firstForm.id, secondForm.id],
    });
    const firstProductDownloads = await submissionsMetric.timeSeries(
      from,
      to,
      { formIds: [firstForm.id] },
    );

    expect(allDownloads.total).toBe(2);
    expect(firstProductDownloads.total).toBe(1);
  });
});
