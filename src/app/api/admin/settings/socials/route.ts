import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await authAdmin();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const socials = await db.socialChannel.findMany({
      where: {
        url: {
          not: null,
        },
      },
    });

    return NextResponse.json(socials);
  } catch (error) {
    console.log("[SETTINGS_SOCIAL_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
