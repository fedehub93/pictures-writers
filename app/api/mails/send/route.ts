import { NextResponse } from "next/server";
import Handlebars from "handlebars";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { sendSendgridEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { audiences, subject, bodyHtml } = await req.json();

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

    if (!audiences || audiences.length === 0) {
      return new NextResponse("Missing audiences", { status: 400 });
    }
    if (!settings.emailSender) {
      return new NextResponse("Missing email sender", { status: 400 });
    }

    for (const audience of audiences) {
      const contacts = await db.emailContact.findMany({
        where: {
          audiences: {
            some: { id: audience.value },
          },
        },
      });
      for (const contact of contacts) {
        const template = Handlebars.compile(bodyHtml);
        const html = template({
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
        });
        await sendSendgridEmail({
          to: contact.email,
          from: settings.emailSender,
          subject,
          html,
        });
      }
    }

    return NextResponse.json({ status: "sent" });
  } catch (error) {
    console.log("[MAILS_SEND]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
