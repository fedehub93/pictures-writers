import { NextRequest, NextResponse } from "next/server";
import { ContentStatus } from "@/generated/prisma";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await authAdmin();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tags = await db.tag.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
