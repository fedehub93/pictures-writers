import { NextResponse } from "next/server";
import * as sgMail from "@sendgrid/mail";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { emailRecipient, emailTemplateId, subject, bodyHtml } =
      await req.json();

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

    let emailTemplate = null;

    if (emailTemplateId) {
      emailTemplate = await db.emailTemplate.findUnique({
        where: { id: emailTemplateId },
      });
    }

    if (!emailRecipient || emailRecipient.length === 0) {
      return new NextResponse("Missing email recipient", { status: 400 });
    }
    if (!settings.emailSender) {
      return new NextResponse("Missing email sender", { status: 400 });
    }

    sgMail.setApiKey(settings.emailApiKey);
    await sgMail.send({
      to: emailRecipient,
      from: settings.emailSender,
      subject: subject || "TEST",
      html: bodyHtml || emailTemplate?.bodyHtml || "<p>Test email</p>",
    });

    return NextResponse.json({ status: "sent" });
  } catch (error) {
    console.log("[MAILS_SEND]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
