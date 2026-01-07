import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { EmailProvider } from "@/prisma/generated/client";

export async function PATCH(req: Request) {
  try {
    const user = await authAdmin();
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let settings = await db.emailSetting.findFirst();

    if (!settings) {
      settings = await db.emailSetting.create({
        data: {
          ...values,
          emailProvider: EmailProvider.SENDGRID,
        },
      });
    }

    const updatedSettings = await db.emailSetting.updateMany({
      data: {
        ...values,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.log("[EMAIL_SETTINGS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
