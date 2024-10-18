import * as sgMail from "@sendgrid/mail";
import handlebars from "handlebars";

import { db } from "./db";
import { endOfDay, startOfDay } from "date-fns";

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
  });
};

export const sendFreeEbookEmail = async (email: string, ebookId: string) => {
  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailSender || !settings.freeEbookTemplateId)
    return false;

  const ebook = await db.ebook.findUnique({
    where: { id: ebookId },
  });

  if (!ebook) return false;

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
      imageCoverUrl: ebook.imageCoverUrl,
    }),
  });

  return true;
};

type SendgridEmail = {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
};

export const sendSendgridEmail = async ({
  to,
  from,
  subject,
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
};

export const getEmailsSentToday = async () => {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  const emailsSentToday = await db.emailSingleSendLog.count({
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
