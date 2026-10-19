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

  await createContactByEmail(email, "webinar_purchased");

  const webinarTemplate = await db.emailTemplate.findUnique({
    where: {
      id: settings.webinarTemplateId,
    },
  });

  if (!webinarTemplate?.bodyHtml) return false;

  const template = handlebars.compile(webinarTemplate.bodyHtml);

  await sendEmail({
    to: email,
    from: resolveSender(settings)!,
    subject: `Webinar: ${webinar.title} acquistato con successo`,
    html: template({
      email,
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

export const sendFreeEbookEmail = async (
  email: string,
  ebookId: string,
  format: string,
) => {
  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailSender || !settings.freeEbookTemplateId)
    return false;

  const ebookRoot = await db.productRoot.findFirst({
    where: {
      id: ebookId,
      type: ProductType.EBOOK,
      liveVersion: { isNot: null },
    },
    select: {
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

  const ebook = ebookRoot?.liveVersion;

  if (!ebook || !isEbookMetadata(ebook.metadata)) return false;

  const freeEbookTemplate = await db.emailTemplate.findUnique({
    where: {
      id: settings.freeEbookTemplateId,
    },
  });

  if (!freeEbookTemplate?.bodyHtml) return false;

  const template = handlebars.compile(freeEbookTemplate.bodyHtml);

  await sendEmail({
    to: email,
    from: resolveSender(settings)!,
    subject: `Free ebook: ${ebook.title}`,
    html: template({
      email,
      id: ebook.id,
      title: ebook.title,
      description: renderTiptapHtml(ebook.tiptapDescription),
      format,
      imageCoverUrl: ebook.imageCover?.url,
    }),
    type: "free_ebook_email",
    replyTo: settings.emailResponse!,
  });

  return true;
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
