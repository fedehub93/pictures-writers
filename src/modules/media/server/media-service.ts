import "server-only";

import { randomUUID } from "node:crypto";

import { MediaType } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import { buildMediaDeliveryUrl } from "@/modules/media/lib/manifest";
import {
  mediaLibrarySelect,
  type MediaLibraryItem,
} from "@/modules/media/lib/media-library";
import type { MediaRendition } from "@/modules/media/types";

import { checksumOf } from "./image-bytes";
import { generateRenditions, normaliseImage } from "./process-image";
import type { StorageDriver } from "./storage";

export interface MediaUploadSource {
  key: string | null;
  url: string;
  name: string;
  type: MediaType;
  altText?: string | null;
  mimeType?: string | null;
  size?: number | null;
}

export interface CreateMediaFromUploadOptions {
  driver: StorageDriver;
  source: MediaUploadSource;
  /** Explicit admin override: keep the duplicate and create a second row. */
  override?: boolean;
}

export class DuplicateMediaError extends Error {
  constructor(readonly existing: MediaLibraryItem) {
    super(`A media with the same checksum already exists: "${existing.id}"`);
    this.name = "DuplicateMediaError";
  }
}

export class MediaProcessingError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MediaProcessingError";
  }
}

function findDuplicate(checksum: string): Promise<MediaLibraryItem | null> {
  return db.media.findFirst({
    where: { checksum, archivedAt: null },
    select: mediaLibrarySelect,
    orderBy: { createdAt: "asc" },
  });
}

async function createPlainMedia(
  source: MediaUploadSource,
): Promise<MediaLibraryItem> {
  return db.media.create({
    data: {
      name: source.name,
      key: source.key,
      url: source.url,
      size: source.size ?? null,
      type: source.type,
      altText: source.altText || null,
      mimeType: source.mimeType || null,
    },
    select: mediaLibrarySelect,
  });
}

/**
 * Turns an uploaded object into a Media.
 *
 * Images are downloaded once, normalised, cut into the full rendition ladder
 * and written under `<mediaId>/<revision>/`. The Media row is only created
 * after every object exists, and a failure removes the whole prefix so the
 * library never holds a half-processed file. Other media types keep the
 * historical behaviour: the uploaded object is recorded, never copied.
 */
export async function createMediaFromUpload({
  driver,
  source,
  override = false,
}: CreateMediaFromUploadOptions): Promise<MediaLibraryItem> {
  if (source.type !== MediaType.IMAGE) {
    return createPlainMedia(source);
  }

  if (!source.key) {
    throw new MediaProcessingError(
      "The uploaded image cannot be processed because its storage key is missing.",
    );
  }

  let originalBytes: Uint8Array<ArrayBuffer>;
  try {
    originalBytes = await driver.get(source.key);
  } catch (error) {
    throw new MediaProcessingError(
      "The uploaded file could not be read from storage.",
      { cause: error },
    );
  }

  const checksum = checksumOf(originalBytes);

  if (!override) {
    const existing = await findDuplicate(checksum);
    if (existing) throw new DuplicateMediaError(existing);
  }

  const id = randomUUID();
  const revision = 1;
  const prefix = `${id}/`;
  const originalKey = `${id}/${revision}/original`;

  try {
    const image = await normaliseImage(originalBytes);
    const generated = await generateRenditions(image);

    await driver.put(originalKey, image.bytes, image.mimeType);

    const manifest: MediaRendition[] = [];
    for (const rendition of generated) {
      const key = `${id}/${revision}/${rendition.width}.${rendition.format}`;
      await driver.put(key, rendition.bytes, `image/${rendition.format}`);

      manifest.push({
        key,
        width: rendition.width,
        height: rendition.height,
        bytes: rendition.bytes.byteLength,
        format: rendition.format,
      });
    }

    const originalUrl = await driver.url(originalKey);
    const renditionUrls = await Promise.all(
      manifest.map((rendition) => driver.url(rendition.key)),
    );
    const url = buildMediaDeliveryUrl(originalUrl, {
      revision,
      archived: false,
      renditions: manifest.map((rendition, index) => ({
        width: rendition.width,
        format: rendition.format,
        url: renditionUrls[index],
      })),
    });

    const media = await db.media.create({
      data: {
        id,
        name: source.name,
        key: originalKey,
        url,
        size: image.bytes.byteLength,
        type: MediaType.IMAGE,
        altText: source.altText || null,
        mimeType: image.mimeType,
        checksum,
        revision,
        metadata: image.metadata as PrismaJson.MediaMetadata,
        renditions: manifest as PrismaJson.MediaRenditions,
      },
      select: mediaLibrarySelect,
    });

    // The uploaded object was only the processing input. Best-effort removal
    // keeps the storage tier clean; legacy UploadThing file keys are not
    // addressable by customId and simply stay behind.
    if (!source.key.startsWith(prefix)) {
      await driver.delete(source.key).catch(() => undefined);
    }

    return media;
  } catch (error) {
    await driver.deletePrefix(prefix).catch(() => undefined);

    if (error instanceof MediaProcessingError) throw error;

    throw new MediaProcessingError(
      "The image could not be processed. Nothing was added to the library.",
      { cause: error },
    );
  }
}
