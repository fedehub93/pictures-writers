import * as sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";

import { db } from "./db";

export const sendSubscriptionEmail = async (email: string, token: string) => {
  const confirmLink = `http://localhost:3000/auth/new-subscription?token=${token}`;

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
