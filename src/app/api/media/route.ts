import { NextResponse } from "next/server";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { authAdmin } from "@/lib/auth-service";

import {
  mediaLibrarySelect,
  type MediaLibraryItem,
} from "@/modules/media/lib/media-library";
import {
  createMediaFromUpload,
  DuplicateMediaError,
  MediaProcessingError,
  type MediaUploadSource,
} from "@/modules/media/server/media-service";
import { getStorageDriver } from "@/modules/media/server/storage";

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

    let media: MediaLibraryItem[] = [];
    let totalMedia = 0;

    const skip = (page - 1) * MEDIA_BATCH;
    const take = MEDIA_BATCH;
    const where = {
      name: { contains: s, mode: "insensitive" as const },
      archivedAt: null,
    };

    if (cursor) {
      const assets = await db.media.findMany({
        where,
        select: mediaLibrarySelect,
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
          where,
          select: mediaLibrarySelect,
          take,
          skip,
          orderBy: {
            createdAt: "desc",
          },
        }),
        db.media.count({ where }),
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

type MediaUploadPayload = Partial<MediaUploadSource> & { override?: boolean };

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const values = (await req.json()) as MediaUploadPayload;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!values.name || !values.url) {
      return NextResponse.json(
        { error: "A name and an uploaded file are required." },
        { status: 400 },
      );
    }

    const source: MediaUploadSource = {
      key: values.key ?? null,
      url: values.url,
      name: values.name,
      type: values.type ?? MediaType.FILE,
      altText: values.altText ?? null,
      mimeType: values.mimeType ?? null,
      size: values.size ?? null,
    };

    try {
      const media = await createMediaFromUpload({
        driver: getStorageDriver(),
        source,
        override: values.override === true,
      });

      return NextResponse.json(media);
    } catch (error) {
      if (error instanceof DuplicateMediaError) {
        return NextResponse.json(
          { duplicate: true, media: error.existing },
          { status: 409 },
        );
      }

      if (error instanceof MediaProcessingError) {
        console.log("[MEDIA_POST]", error);
        return NextResponse.json({ error: error.message }, { status: 422 });
      }

      throw error;
    }
  } catch (error) {
    console.log("[MEDIA_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
