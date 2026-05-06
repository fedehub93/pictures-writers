import * as sgMail from "@sendgrid/mail";
import { Resend } from "resend";
import { endOfDay, startOfDay } from "date-fns";
import handlebars from "handlebars";

import { ContentStatus, ProductType, EmailProvider } from "@/generated/prisma";
import { db } from "@/lib/db";
import { isEbookMetadata, isWebinarMetadata } from "@/type-guards";
import { createContactByEmail } from "@/data/email-contact";
import { handleProductPurchased } from "./event-handler";

type GenericEmail = {
  to: string;
  from: string;
  subject: string;
  type: string;
  replyTo?: string;
  text?: string;
  html?: string;
};

export const sendSendgridEmail = async ({
  to,
  from,
  subject,
  type,
  replyTo,
  text,
  html,
}: GenericEmail) => {
  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailApiKey || !settings.emailSender) return false;

  if (!html) return;

  sgMail.setApiKey(settings.emailApiKey);
  await sgMail.send({
    to,
    from,
    subject,
    html,
    replyTo,
  });

  await db.emailSendLog.create({
    data: {
      to,
      from,
      subject,
      type,
    },
  });
};

export const sendResendEmail = async ({
  to,
  from,
  subject,
  type,
  replyTo,
  text,
  html,
}: GenericEmail) => {
  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailApiKey || !settings.emailSender) return false;

  if (!html) return;

  const resend = new Resend(process.env.NEXT_RESEND_KEY);

  await resend.emails.send({
    to,
    from,
    subject,
    html,
    replyTo,
  });

  await db.emailSendLog.create({
    data: {
      to,
      from,
      subject,
      type,
    },
  });
};

export const sendEmail = async (emailData: GenericEmail) => {
  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailProvider) {
    return false;
  }
  if (settings.emailProvider === EmailProvider.SENDGRID) {
    return sendSendgridEmail(emailData);
  } else if (settings.emailProvider === EmailProvider.RESEND) {
    return sendResendEmail(emailData);
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

  const webinar = await db.product.findFirst({
    where: {
      rootId: productRootId,
      type: ProductType.WEBINAR,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      imageCover: true,
    },
  });

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
    from: settings.emailSender,
    subject: `Webinar: ${webinar.title} acquistato con successo`,
    html: template({
      email,
      id: webinar.id,
      title: webinar.title,
      description: webinar.description,
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
    from: settings.emailSender,
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

  const ebook = await db.product.findFirst({
    where: {
      rootId: ebookId,
      type: ProductType.EBOOK,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      imageCover: true,
    },
  });

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
    from: settings.emailSender,
    subject: `Free ebook: ${ebook.title}`,
    html: template({
      email,
      id: ebook.id,
      title: ebook.title,
      description: ebook.description,
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
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  const emailsSentToday = await db.emailSendLog.count({
    where: {
      createdAt: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
  });

  return emailsSentToday;
};

export const getTodayEmailsAvailable = async () => {
  const settings = await db.emailSetting.findFirst();
  if (!settings || !settings.maxEmailsPerDay) return 0;

  const emailsSentToday = await getEmailsSentToday();

  return settings.maxEmailsPerDay - emailsSentToday;
};
