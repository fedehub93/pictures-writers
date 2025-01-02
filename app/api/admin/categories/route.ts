import { ContentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const categories = await db.category.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.log("[ADMIN_CATEGORIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
