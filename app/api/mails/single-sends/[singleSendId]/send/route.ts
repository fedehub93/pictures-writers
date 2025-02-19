import { NextResponse } from "next/server";

import Handlebars from "handlebars";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { getEmailsSentToday, sendSendgridEmail } from "@/lib/mail";

export const maxDuration = 30;
export async function GET(req: Request, props: { params: Promise<{ singleSendId: string }> }) {
  const params = await props.params;
  try {
    const encoder = new TextEncoder();
    const { singleSendId } = params;

    const user = await authAdmin();

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

    const singleSend = await db.emailSingleSend.findUnique({
      where: {
        id: singleSendId,
      },
      include: {
        audiences: true,
      },
    });

    if (!singleSend || !singleSend.bodyHtml || !singleSend.subject) {
      return new NextResponse("Wrong single send ID", { status: 400 });
    }

    const { audiences, subject, bodyHtml } = singleSend;

    if (!audiences || audiences.length === 0) {
      return new NextResponse("Missing audiences", { status: 400 });
    }
    if (!settings.emailSender) {
      return new NextResponse("Missing email sender", { status: 400 });
    }

    const emailsSentToday = await getEmailsSentToday();
    const availableEmailsToSend =
      (settings?.maxEmailsPerDay || 0) - emailsSentToday;

    const contacts = await db.emailContact.findMany({
      where: {
        audiences: {
          some: {
            id: {
              in: audiences.map((a) => a.id),
            },
          },
        },
        emailSingleSendLogs: {
          none: {
            singleSendId,
          },
        },
        isSubscriber: true,
      },
      take: availableEmailsToSend,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const totalContacts = contacts.length;
          for (const [i, contact] of contacts.entries()) {
            const template = Handlebars.compile(bodyHtml);

            const html = template({
              id: contact.id,
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
            });

            await sendSendgridEmail({
              to: contact.email,
              from: `${settings.emailSenderName} <${settings.emailSender}>`,
              subject,
              html,
              type: "single_send_email",
            });

            await db.emailSingleSendLog.create({
              data: {
                contactId: contact.id,
                singleSendId,
              },
            });

            const progress = Math.round(((i + 1) / totalContacts) * 100);

            const progressData = `data: { "progress": ${progress}, "done":false }\n\n`;
            controller.enqueue(encoder.encode(progressData));
          }

          const doneData = `data: { "progress": 100, "done": true }\n\n`;
          controller.enqueue(encoder.encode(doneData));

          controller.close();
        } catch (error) {
          controller.close();
        }
      },
    });

    // return NextResponse.json({ status: "sent" });
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.log("[MAILS_SINGLE_SENDS_SEND]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
