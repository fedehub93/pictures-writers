import * as sgMail from "@sendgrid/mail";
import { endOfDay, startOfDay } from "date-fns";
import handlebars from "handlebars";

import { ContentStatus, ProductCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { isEbookMetadata } from "@/type-guards";

type SendgridEmail = {
  to: string;
  from: string;
  subject: string;
  type: string;
  text?: string;
  html?: string;
};

export const sendSendgridEmail = async ({
  to,
  from,
  subject,
  type,
  text,
  html,
}: SendgridEmail) => {
  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailApiKey || !settings.emailSender) return false;

  if (!html) return;

  sgMail.setApiKey(settings.emailApiKey);
  await sgMail.send({
    to,
    from,
    subject,
    html,
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

  await sendSendgridEmail({
    to: email,
    from: settings.emailSender,
    subject: "Conferma sottoscrizione",
    html: template({ token, email }),
    type: "subscription_email",
  });
};

export const sendFreeEbookEmail = async (
  email: string,
  ebookId: string,
  format: string
) => {
  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailSender || !settings.freeEbookTemplateId)
    return false;

  const ebook = await db.product.findFirst({
    where: {
      rootId: ebookId,
      category: ProductCategory.EBOOK,
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

  await sendSendgridEmail({
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
