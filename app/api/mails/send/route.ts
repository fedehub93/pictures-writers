import { NextResponse } from "next/server";

import Handlebars from "handlebars";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { getEmailsSentToday, sendSendgridEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const {
      emailRecipient,
      emailTemplateId,
    }: {
      emailRecipient: string;
      emailTemplateId: string;
    } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const settings = await db.emailSetting.findFirst();
    if (!settings) {
      return new NextResponse("Missing settings record", { status: 400 });
    }

    if (!settings.emailApiKey) {
      return new NextResponse("Missing API key", { status: 400 });
    }

    if (!settings.emailSender) {
      return new NextResponse("Missing email sender", { status: 400 });
    }

    const emailsSentToday = await getEmailsSentToday();
    const availableEmailsToSend =
      (settings?.maxEmailsPerDay || 0) - emailsSentToday;

    const emailTemplate = await db.emailTemplate.findUnique({
      where: {
        id: emailTemplateId,
      },
    });

    if (!emailTemplate) {
      return new NextResponse("Email Template error", { status: 400 });
    }

    const template = Handlebars.compile(emailTemplate.bodyHtml);

    const html = template({});

    await sendSendgridEmail({
      to: emailRecipient,
      from: `${settings.emailSenderName} <${settings.emailSender}>`,
      subject: "Email test",
      html,
      type: "free_email",
    });

    return NextResponse.json({ status: "sent" });
  } catch (error) {
    console.log("[MAILS_SEND]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
