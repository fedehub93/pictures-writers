import "server-only";

import * as sgMail from "@sendgrid/mail";
import { endOfDay, startOfDay } from "date-fns";
import handlebars from "handlebars";

import { ProductType, EmailProvider } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import {
  isEbookMetadata,
  isWebinarMetadata,
} from "@/modules/shop/products/types";
import { createContactByEmail } from "@/data/email-contact";
import { normalizeEmail } from "@/shared/lib/email";
import { renderTiptapHtml } from "@/shared/components/tiptap-renderer/helpers/render-tiptap-html";
import { GenericEmail } from "./types";
import { resolveSender } from "./sender";
import { resolveAdapter } from "./provider";

import { handleProductPurchased } from "../../../lib/event-handler";

export interface SendEmailOptions {
  /**
   * When false, the send is not recorded in `EmailSendLog`. Callers that need
   * to own the audit row (e.g. automation sends with an idempotency key) use
   * this so the log is written once, not twice.
   */
  log?: boolean;
}

async function recordSend(data: GenericEmail): Promise<void> {
  await db.emailSendLog.create({
    data: {
      to: data.to,
      from: data.from,
      subject: data.subject,
      type: data.type,
      idempotencyKey: data.idempotencyKey,
    },
  });
}

export const sendSendgridEmail = async (
  {
    to,
    from,
    subject,
    type,
    replyTo,
    text: _text,
    html,
    headers,
    idempotencyKey,
  }: GenericEmail,
  options: SendEmailOptions = {},
) => {
  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailApiKey || !settings.emailSender) return false;

  if (!html) return false;

  sgMail.setApiKey(settings.emailApiKey);
  await sgMail.send({
    to,
    from,
    subject,
    html,
    replyTo,
    headers,
  });

  if (options.log !== false) {
    await recordSend({ to, from, subject, type, idempotencyKey });
  }

  return true;
};

export const sendResendEmail = async (
  {
    to,
    from,
    subject,
    type,
    replyTo,
    text: _text,
    html,
    headers,
    idempotencyKey,
  }: GenericEmail,
  options: SendEmailOptions = {},
) => {
  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailSender) return false;

  if (!html) return false;

  const adapter = await resolveAdapter();

  const result = await adapter.sendOneToOne({
    to,
    from,
    subject,
    html,
    replyTo,
    headers,
    idempotencyKey,
  });

  if (!result.success) {
    return false;
  }

  if (options.log !== false) {
    await recordSend({ to, from, subject, type, idempotencyKey });
  }

  return true;
};

export const sendEmail = async (
  emailData: GenericEmail,
  options: SendEmailOptions = {},
) => {
  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailProvider) {
    return false;
  }
  if (settings.emailProvider === EmailProvider.SENDGRID) {
    return sendSendgridEmail(emailData, options);
  } else if (settings.emailProvider === EmailProvider.RESEND) {
    return sendResendEmail(emailData, options);
  }

  return false;
};

export const sendWebinarPurchaseEmail = async (
  email: string,
  productRootId: string,
) => {
  const recipient = normalizeEmail(email);

  // A purchase without a usable address must not create a Contact: with a
  // single canonical identity, an empty string would become the contact of
  // every anonymous purchase.
  if (!recipient) return false;

  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailSender || !settings.webinarTemplateId)
    return false;

  const root = await db.productRoot.findFirst({
    where: {
      id: productRootId,
      type: ProductType.WEBINAR,
      liveVersion: { isNot: null },
    },
    select: {
      type: true,
      liveVersion: {
        select: {
          id: true,
          title: true,
          tiptapDescription: true,
          metadata: true,
          imageCover: {
            select: {
              url: true,
            },
          },
        },
      },
    },
  });

  const webinar = root?.liveVersion
    ? { ...root.liveVersion, type: root.type }
    : null;

  if (!webinar || !isWebinarMetadata(webinar.metadata)) return false;

  await createContactByEmail(recipient, "webinar_purchased");

  const webinarTemplate = await db.emailTemplate.findUnique({
    where: {
      id: settings.webinarTemplateId,
    },
  });

  if (!webinarTemplate?.bodyHtml) return false;

  const template = handlebars.compile(webinarTemplate.bodyHtml);

  await sendEmail({
    to: recipient,
    from: resolveSender(settings)!,
    subject: `Webinar: ${webinar.title} acquistato con successo`,
    html: template({
      email: recipient,
      id: webinar.id,
      title: webinar.title,
      description: renderTiptapHtml(webinar.tiptapDescription),
      imageCoverUrl: webinar.imageCover?.url,
    }),
    type: "webinar_purchased",
    replyTo: settings.emailResponse!,
  });

  await handleProductPurchased({ type: webinar.type });

  return true;
};

export const sendSubscriptionEmail = async (email: string, token: string) => {
  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailSender || !settings.subscriptionTemplateId)
    return false;

  const subscriptionTemplate = await db.emailTemplate.findUnique({
    where: {
      id: settings.subscriptionTemplateId,
    },
  });

  if (!subscriptionTemplate?.bodyHtml) return false;

  const template = handlebars.compile(subscriptionTemplate.bodyHtml);

  await sendEmail({
    to: email,
    from: resolveSender(settings)!,
    subject: "Conferma sottoscrizione",
    html: template({ token, email }),
    type: "subscription_email",
    replyTo: settings.emailResponse!,
  });
};

/**
 * Renders the delivery email for a free digital download.
 *
 * Returns `null` when the global template is not configured, the product is not
 * a live `EBOOK`, or its metadata carries no downloadable format. Callers treat
 * `null` as "delivery unavailable" and must not record a download, so a
 * misconfigured setting never creates a submission the visitor cannot fulfil.
 */
export const buildFreeDigitalDownloadEmail = async (
  email: string,
  rootId: string,
): Promise<GenericEmail | null> => {
  const settings = await db.emailSetting.findFirst();

  if (
    !settings ||
    !settings.emailSender ||
    !settings.emailProvider ||
    !settings.freeDigitalDownloadTemplateId
  ) {
    return null;
  }

  const root = await db.productRoot.findFirst({
    where: {
      id: rootId,
      type: ProductType.EBOOK,
      liveVersion: { isNot: null },
    },
    select: {
      slug: true,
      liveVersion: {
        select: {
          id: true,
          title: true,
          tiptapDescription: true,
          metadata: true,
          imageCover: {
            select: {
              url: true,
            },
          },
        },
      },
    },
  });

  const product = root?.liveVersion;

  if (!product || !isEbookMetadata(product.metadata)) return null;

  // Prefer the PDF when present, otherwise deliver the first configured format.
  const format =
    product.metadata.formats.find((item) => item.type === "pdf") ??
    product.metadata.formats[0];

  if (!format) return null;

  const downloadTemplate = await db.emailTemplate.findUnique({
    where: {
      id: settings.freeDigitalDownloadTemplateId,
    },
  });

  if (!downloadTemplate?.bodyHtml) return null;

  const template = handlebars.compile(downloadTemplate.bodyHtml);
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/+$/, "");
  const downloadUrl = `${appUrl}/api/products/download?id=${encodeURIComponent(
    rootId,
  )}&format=${format.type}`;

  return {
    to: email,
    from: resolveSender(settings)!,
    subject: `Il tuo download gratuito: ${product.title}`,
    html: template({
      email,
      id: product.id,
      rootId,
      slug: root.slug,
      title: product.title,
      description: renderTiptapHtml(product.tiptapDescription),
      format: format.type,
      imageCoverUrl: product.imageCover?.url,
      downloadUrl,
    }),
    type: "free_digital_download_email",
    replyTo: settings.emailResponse ?? undefined,
  };
};

export const getEmailsSentToday = async () => {
  const today = new Date();
  const createdAt = { gte: startOfDay(today), lte: endOfDay(today) };

  // `maxEmailsPerDay` is the provider's transactional quota. It counts:
  //  - `EmailSendLog` rows: system/transactional sends (orders, ebooks, and
  //    automation steps), which record themselves there for auditability;
  //  - OUTBOUND `EmailMessage` rows: one-to-one conversation replies.
  // Marketing broadcasts (SingleSends) are intentionally excluded — they go
  // through the provider's broadcast pipeline and write to neither table.
  const [systemSends, oneToOneSends] = await Promise.all([
    db.emailSendLog.count({ where: { createdAt } }),
    db.emailMessage.count({ where: { direction: "OUTBOUND", createdAt } }),
  ]);

  return systemSends + oneToOneSends;
};

export const getTodayEmailsAvailable = async () => {
  const settings = await db.emailSetting.findFirst();
  // An unconfigured limit means sending is not capped.
  if (settings?.maxEmailsPerDay == null) {
    return Number.POSITIVE_INFINITY;
  }

  const emailsSentToday = await getEmailsSentToday();

  return settings.maxEmailsPerDay - emailsSentToday;
};
