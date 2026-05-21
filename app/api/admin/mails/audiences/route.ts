import { NextRequest, NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await authAdmin();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const audiences = await db.emailAudience.findMany();

    return NextResponse.json(audiences);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "EMAIL_AUDIENCES_GET" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { name } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const audience = await db.emailAudience.create({
      data: {
        name,
      },
    });

    return NextResponse.json(audience);
  } catch (error) {
    console.log("[EMAIL_AUDIENCES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
