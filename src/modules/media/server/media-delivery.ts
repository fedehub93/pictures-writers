import "server-only";

import type { Prisma } from "@/generated/prisma";
import { StoredFileKind } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { parentKeyPrefix, parseMediaKey } from "./media-key";
import { recordedStorageDriverName } from "./storage";
import { remoteUrlForAddress } from "./stored-file";

const deliveryMediaSelect = {
  id: true,
  key: true,
  url: true,
  mimeType: true,
  storageDriver: true,
} satisfies Prisma.MediaSelect;

const storedFileLocationSelect = {
  key: true,
  driver: true,
  remoteUrl: true,
  contentType: true,
} satisfies Prisma.StoredFileSelect;

type DeliveryMediaRow = Prisma.MediaGetPayload<{
  select: typeof deliveryMediaSelect;
}>;

type StoredFileLocationRow = Prisma.StoredFileGetPayload<{
  select: typeof storedFileLocationSelect;
}>;

/**
 * Where the bytes of a requested delivery key are. The stored-file record is
 * the answer; the Media's own storage columns are read only to fall back for a
 * row whose record has not been created yet.
 */
export interface DeliveryFile {
  /** The driver that owns the bytes, with the pre-seam rule applied. */
  driver: string;
  /** The provider address of the original; null for a local file. */
  remoteUrl: string | null;
  /** The original's recorded content type; null for a rendition. */
  contentType: string | null;
  /** The owning Media's content type, used when no newer record exists. */
  mediaMimeType: string | null;
  /** The Media's stored address, which carries a remote rendition manifest. */
  mediaUrl: string;
  /** Whether the requested key is a rendition rather than the original. */
  rendition: boolean;
}

function locationOf(
  media: DeliveryMediaRow,
  record: StoredFileLocationRow | null,
  rendition: boolean,
): DeliveryFile {
  return {
    driver: recordedStorageDriverName(record?.driver ?? media.storageDriver),
    // A record written before the address backfill may still lack the provider
    // location; the Media's own address answers it without asking the provider.
    remoteUrl:
      record?.remoteUrl ??
      (rendition ? null : remoteUrlForAddress(media.url)),
    contentType: rendition ? null : (record?.contentType ?? media.mimeType),
    mediaMimeType: media.mimeType,
    mediaUrl: media.url,
    rendition,
  };
}

/**
 * Resolves the stored file a delivery key addresses.
 *
 * The stored-file record is looked up first, so the key, driver and provider
 * address come from one place. A rendition has no record of its own: its owner
 * is resolved from the parsed key and the requested key must sit under that
 * Media's revision prefix, which is how ownership is proved rather than
 * trusted. A Media whose record has not been created yet still resolves from
 * its own columns, so deploying this code before the one-time backfill cannot
 * darken an existing picture.
 */
export async function findDeliveryFile(
  key: string,
): Promise<DeliveryFile | null> {
  const record = await db.storedFile.findFirst({
    where: { key, kind: StoredFileKind.MEDIA, mediaId: { not: null } },
    select: {
      ...storedFileLocationSelect,
      media: { select: deliveryMediaSelect },
    },
  });

  if (record?.media) {
    return locationOf(record.media, record, false);
  }

  const legacy = await db.media.findFirst({
    where: { key },
    select: deliveryMediaSelect,
  });

  if (legacy?.key) {
    return locationOf(legacy, null, false);
  }

  const parts = parseMediaKey(key);
  if (!parts) return null;

  const owner = await db.media.findFirst({
    where: { id: parts.mediaId, revision: parts.revision },
    select: {
      ...deliveryMediaSelect,
      storedFile: { select: storedFileLocationSelect },
    },
  });

  if (!owner) return null;

  const originalKey = owner.storedFile?.key ?? owner.key;
  if (!originalKey) return null;

  return key.startsWith(`${parentKeyPrefix(originalKey)}/`)
    ? locationOf(owner, owner.storedFile, true)
    : null;
}
