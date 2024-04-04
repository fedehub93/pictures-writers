import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { name } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const template = await db.emailTemplate.create({
      data: {
        name,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.log("[EMAIL_TEMPLATES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
