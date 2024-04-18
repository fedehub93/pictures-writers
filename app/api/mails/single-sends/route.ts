import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { name, emailTemplateId } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const template = await db.emailTemplate.findUnique({
      where: {
        id: emailTemplateId,
      },
    });

    const singleSend = await db.emailSingleSend.create({
      data: {
        name,
        designData: template?.designData,
        bodyHtml: template?.bodyHtml,
      },
    });

    return NextResponse.json(singleSend);
  } catch (error) {
    console.log("[EMAIL_SINGLE_SENDS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
