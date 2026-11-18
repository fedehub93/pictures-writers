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
import { resolveStorageDriver } from "@/modules/media/server/storage";

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

function mediaTypeFromMimeType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return MediaType.IMAGE;
  if (mimeType.startsWith("video/")) return MediaType.VIDEO;
  if (mimeType.startsWith("audio/")) return MediaType.AUDIO;
  return MediaType.FILE;
}

function isMultipartRequest(req: Request): boolean {
  const contentType = req.headers.get("content-type") ?? "";
  return contentType.includes("multipart/form-data");
}

async function handleMultipartUpload(req: Request): Promise<Response> {
  const { driver, name: driverName } = resolveStorageDriver();
  const form = await req.formData();
  const file = form.get("file");
  const override = form.get("override") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A file is required." },
      { status: 400 },
    );
  }

  const mimeType = file.type || "application/octet-stream";
  const type = mediaTypeFromMimeType(mimeType);

  if (type !== MediaType.IMAGE) {
    return NextResponse.json(
      { error: "Only image uploads are supported through multipart." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const tempKey = `tmp/${crypto.randomUUID()}`;

  await driver.put(tempKey, bytes, mimeType);

  const source: MediaUploadSource = {
    key: tempKey,
    url: await driver.url(tempKey),
    name: form.get("name")?.toString() || file.name,
    type,
    altText: form.get("altText")?.toString() || null,
    mimeType,
    size: file.size,
  };

  try {
    const media = await createMediaFromUpload({
      driver,
      storageDriver: driverName,
      source,
      override,
    });

    return NextResponse.json(media);
  } catch (error) {
    // The processing failed after the temporary bytes were written; remove them
    // so a failed attempt never consumes storage.
    await driver.delete(tempKey).catch(() => undefined);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (isMultipartRequest(req)) {
      return handleMultipartUpload(req).catch((error) => {
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

        console.log("[MEDIA_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
      });
    }

    const values = (await req.json()) as MediaUploadPayload;

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
      const { driver, name: driverName } = resolveStorageDriver();
      const media = await createMediaFromUpload({
        driver,
        storageDriver: driverName,
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
