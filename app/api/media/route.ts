import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { Media } from "@prisma/client";

const MEDIA_BATCH = 10;

export async function GET(req: Request) {
  try {
    const user = await authAdmin();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let media: Media[] = [];

    if (cursor) {
      media = await db.media.findMany({
        take: MEDIA_BATCH,
        skip: 1,
        cursor: {
          id: cursor,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      media = await db.media.findMany({
        take: MEDIA_BATCH,
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    let nextCursor = null;

    if (media.length === MEDIA_BATCH) {
      nextCursor = media[MEDIA_BATCH - 1].id;
    }

    return NextResponse.json({ items: media, nextCursor });
  } catch (error) {
    console.log("[MEDIA_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const media = await db.media.create({
      data: {
        ...values,
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.log("[MEDIA_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
