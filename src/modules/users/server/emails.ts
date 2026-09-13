import "server-only";

import { sendEmail } from "@/modules/mails/lib/mail";
import { db } from "@/shared/lib/db";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const getSender = async () => {
  const settings = await db.emailSetting.findFirst({
    select: { emailSender: true, emailResponse: true },
  });
  return settings;
};

export const sendInvitationEmail = async (email: string, token: string, roleName: string) => {
  const sender = await getSender();
  if (!sender?.emailSender) return false;
  const url = `${appUrl()}/invite/${encodeURIComponent(token)}/`;
  return sendEmail({
    to: email,
    from: sender.emailSender,
    replyTo: sender.emailResponse ?? undefined,
    subject: "You have been invited to the backoffice",
    type: "backoffice_invitation",
    html: `<p>You have been invited to join the backoffice as <strong>${escapeHtml(roleName)}</strong>.</p><p><a href="${url}">Activate your account</a>. This link expires in 72 hours.</p>`,
  });
};

export const sendPasswordResetEmail = async (email: string, url: string) => {
  const sender = await getSender();
  if (!sender?.emailSender) return false;
  return sendEmail({
    to: email,
    from: sender.emailSender,
    replyTo: sender.emailResponse ?? undefined,
    subject: "Reset your backoffice password",
    type: "backoffice_password_reset",
    html: `<p>A password reset was requested for this account.</p><p><a href="${url}">Choose a new password</a>.</p><p>If you did not request this, you can ignore this email.</p>`,
  });
};
