import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { Media } from "@prisma/client";

const MEDIA_BATCH = 10;

export async function GET(req: Request) {
  try {
    const user = await authAdmin();
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page")) || 1;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let media: Media[] = [];
    let totalMedia = 0;

    const skip = (page - 1) * MEDIA_BATCH;
    const take = MEDIA_BATCH;

    [media, totalMedia] = await db.$transaction([
      db.media.findMany({
        take,
        skip,
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.media.count(),
    ]);

    const pagination = {
      page,
      perPage: MEDIA_BATCH,
      totalRecords: totalMedia,
      totalPages: Math.ceil(totalMedia / MEDIA_BATCH),
    };

    return NextResponse.json({ items: media, pagination });
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
