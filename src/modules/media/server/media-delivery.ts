import "server-only";

import type { Prisma } from "@/generated/prisma";
import { StoredFileKind } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import {
  mediaAddressSelect,
  mediaRenditionAddress,
} from "@/modules/media/lib/media-address";
import {
  storedFileLocationSelect,
  type StoredFileLocationRow,
} from "@/modules/media/lib/stored-file-location";

import { parentKeyPrefix, parseMediaKey } from "./media-key";
import { recordedStorageDriverName } from "./storage";

const deliveryMediaSelect = {
  ...mediaAddressSelect,
  id: true,
  storedFile: { select: storedFileLocationSelect },
} satisfies Prisma.MediaSelect;

type DeliveryMediaRow = Prisma.MediaGetPayload<{
  select: typeof deliveryMediaSelect;
}>;

/**
 * Where the bytes of an attachment or avatar are. The prefix is the role,
 * never the driver, so this is the same answer for a local file and one still
 * on a provider.
 */
export interface OwnedDeliveryFile {
  driver: string;
  remoteUrl: string | null;
  contentType: string | null;
}

/**
 * Where the bytes of a requested delivery key are. The stored-file record is
 * the answer for an original; a rendition's address is the one its manifest
 * recorded when the bytes were written.
 */
export interface DeliveryFile {
  /** The driver that owns the bytes, with the pre-seam rule applied. */
  driver: string;
  /** The provider address of the requested object; null for a local file. */
  remoteUrl: string | null;
  /** The original's recorded content type; null for a rendition. */
  contentType: string | null;
  /** Whether the requested key is a rendition rather than the original. */
  rendition: boolean;
}

/**
 * Resolves the stored file a `/files/<key>` address names. Only the roles
 * served under that prefix answer: a Media key is a 404 here, just as an
 * attachment key is a 404 under `/media/`.
 */
export async function findOwnedDeliveryFile(
  key: string,
): Promise<OwnedDeliveryFile | null> {
  const record = await db.storedFile.findFirst({
    where: {
      key,
      kind: { in: [StoredFileKind.ATTACHMENT, StoredFileKind.AVATAR] },
    },
    select: storedFileLocationSelect,
  });

  if (!record) return null;

  return {
    driver: recordedStorageDriverName(record.driver),
    remoteUrl: record.remoteUrl,
    contentType: record.contentType,
  };
}

function locationOf(
  media: DeliveryMediaRow,
  key: string,
  role: "original" | "rendition",
): DeliveryFile | null {
  const record: StoredFileLocationRow | null = media.storedFile;
  if (!record) return null;

  const rendition = role === "rendition";

  return {
    driver: recordedStorageDriverName(record.driver),
    // A rendition has no record of its own: its provider address is the one
    // its Media's manifest recorded when the bytes were written.
    remoteUrl: rendition ? mediaRenditionAddress(media, key) : record.remoteUrl,
    contentType: rendition ? null : record.contentType,
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
 * trusted. A Media without a record has no location to answer with, so it is a
 * 404 rather than a guess.
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
    return locationOf(record.media, key, "original");
  }

  const parts = parseMediaKey(key);
  if (!parts) return null;

  const owner = await db.media.findFirst({
    where: { id: parts.mediaId, revision: parts.revision },
    select: deliveryMediaSelect,
  });

  if (!owner) return null;

  const originalKey = owner.storedFile?.key;
  if (!originalKey) return null;

  return key.startsWith(`${parentKeyPrefix(originalKey)}/`)
    ? locationOf(owner, key, "rendition")
    : null;
}
