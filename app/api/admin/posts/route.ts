import { NextRequest, NextResponse } from "next/server";

import { ContentStatus } from "@/prisma/generated/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function GET(req: NextRequest) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const posts = await db.post.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
      },
      select: {
        id: true,
        rootId: true,
        title: true,
        imageCover: { select: { url: true } },
        slug: true,
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
