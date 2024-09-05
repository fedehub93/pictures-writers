import * as sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";

import { db } from "./db";

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

  const template = Handlebars.compile(subscriptionTemplate.bodyHtml);

  await sendSendgridEmail({
    to: email,
    from: settings.emailSender,
    subject: "Confirm your subscription",
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

  const template = Handlebars.compile(freeEbookTemplate.bodyHtml);

  await sendSendgridEmail({
    to: email,
    from: settings.emailSender,
    subject: `Free ebook: ${ebook.title}`,
    html: template({
      email,
      title: ebook.title,
      description: ebook.description,
      imageCoverUrl: ebook.imageCoverUrl,
      fileUrl: ebook.fileUrl,
    }),
  });
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