import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { Media } from "@prisma/client";

const MEDIA_BATCH = 3;

export async function GET(req: Request) {
  try {
    const user = await authAdmin();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const s = searchParams.get("s") || "";
    const page = Number(searchParams.get("page")) || 1;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let media: Media[] = [];
    let totalMedia = 0;

    const skip = (page - 1) * MEDIA_BATCH;
    const take = MEDIA_BATCH;

    if (cursor) {
      const assets = await db.media.findMany({
        where: {
          name: { contains: s },
        },
        take: MEDIA_BATCH,
        skip: 1,
        cursor: { id: cursor },
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor = null;

      if (assets.length === MEDIA_BATCH) {
        nextCursor = assets[MEDIA_BATCH - 1].id;
      }

      return NextResponse.json({ items: assets, nextCursor });
    } else {
      [media, totalMedia] = await db.$transaction([
        db.media.findMany({
          where: {
            name: { contains: s },
          },
          take,
          skip,
          orderBy: {
            createdAt: "desc",
          },
        }),
        db.media.count(),
      ]);
    }

    const pagination = {
      page,
      perPage: MEDIA_BATCH,
      totalRecords: totalMedia,
      totalPages: Math.ceil(totalMedia / MEDIA_BATCH),
    };

    let nextCursor = null;

    if (media.length === MEDIA_BATCH) {
      nextCursor = media[MEDIA_BATCH - 1].id;
    }

    return NextResponse.json({ items: media, pagination, nextCursor });
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
