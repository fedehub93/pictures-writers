import "server-only";

import type { Prisma } from "@/generated/prisma";
import { StoredFileKind, StoredFileOrigin } from "@/generated/prisma";

import {
  LEGACY_ASSET_PREFIX,
  UPLOADTHING_FILE_ORIGIN,
  UPLOADTHING_FILE_PATH,
} from "@/modules/media/lib/image-ladder.mjs";
import { stripMediaManifest } from "@/modules/media/lib/manifest";
import { mediaSourceKey, parseSrc } from "@/modules/media/lib/url";

import type { StorageDriver, StorageDriverName } from "./storage";

/**
 * The columns every batch operation reads to answer "where are the bytes".
 * Renditions are not part of it: they share their original's revision prefix.
 */
export const storedFileLocationSelect = {
  key: true,
  driver: true,
  remoteUrl: true,
  contentType: true,
  size: true,
  checksum: true,
} satisfies Prisma.StoredFileSelect;

export type StoredFileLocationRow = Prisma.StoredFileGetPayload<{
  select: typeof storedFileLocationSelect;
}>;

/**
 * The Media columns a batch may read only while the one-time location backfill
 * has not created the row's record yet. Once the record exists, it answers.
 */
export interface MediaStorageColumns {
  key: string | null;
  url: string;
  storageDriver: string | null;
  mimeType: string | null;
  size: number | null;
  checksum: string | null;
  /** The row's stored-file record, when the one-time backfill has created it. */
  storedFile: StoredFileLocationRow | null;
}

export interface MediaStorageLocation {
  key: string | null;
  driver: string | null;
  contentType: string | null;
  size: number | null;
  checksum: string | null;
}

/**
 * The original's size: the record's when the row has one, the Media's own
 * column only until the one-time backfill creates it. One rule, shared by the
 * quota and the audit.
 */
export function mediaStorageSize(
  media: Pick<MediaStorageColumns, "size">,
  record: Pick<StoredFileLocationRow, "size"> | null,
): number | null {
  return record ? record.size : media.size;
}

/**
 * Where a Media's original bytes are. The stored-file record is the answer;
 * the Media's own storage columns are read only for a row whose record has not
 * been created yet. A field the record carries always wins, including a null,
 * so a later move cannot leave a reader behind.
 */
export function mediaStorageLocation(
  media: MediaStorageColumns,
): MediaStorageLocation {
  const record = media.storedFile;

  if (record) {
    return {
      key: record.key,
      driver: record.driver,
      contentType: record.contentType,
      size: record.size,
      checksum: record.checksum,
    };
  }

  return {
    key: mediaSourceKey(media),
    driver: media.storageDriver,
    contentType: media.mimeType,
    size: media.size,
    checksum: media.checksum,
  };
}

/**
 * The part of a StoredFile that answers "where are the bytes": the key the
 * driver addresses, the driver that owns it, and the provider address when the
 * driver is remote. The role (Media, Attachment, Avatar) lives on the row this
 * record is attached to.
 */
export interface StoredFileLocation {
  key: string;
  driver: string;
  remoteUrl: string | null;
  contentType: string | null;
  size: number | null;
  checksum: string | null;
}

/**
 * The provider address already encoded by a stored address. An absolute
 * address is used as it is, minus the rendition token, which is not part of
 * the object. The legacy `/assets/<key>` shape is the installation's rewrite
 * to the provider, so the library knows where those bytes are without asking
 * the provider. Every other relative address is local.
 */
export function remoteUrlForAddress(address: string): string | null {
  const { url, absolute } = parseSrc(address);

  if (absolute) return stripMediaManifest(address);

  if (url.pathname.startsWith(LEGACY_ASSET_PREFIX)) {
    const key = url.pathname.slice(LEGACY_ASSET_PREFIX.length);
    return key
      ? `${UPLOADTHING_FILE_ORIGIN}${UPLOADTHING_FILE_PATH}${key}`
      : null;
  }

  return null;
}

/**
 * The provider address of a newly written object. A local file has none: its
 * canonical address is `/media/<key>` and the bytes are on this server.
 */
export async function remoteUrlForUpload(
  driver: StorageDriver,
  driverName: StorageDriverName,
  key: string,
): Promise<string | null> {
  return driverName === "local" ? null : driver.url(key);
}

/**
 * The row a Media's location record is created from. The role and the origin
 * are decided here, so no write site can record a Media as another kind.
 */
export function mediaStoredFileCreateData(
  mediaId: string,
  location: StoredFileLocation,
): Prisma.StoredFileUncheckedCreateInput {
  return {
    ...location,
    kind: StoredFileKind.MEDIA,
    origin: StoredFileOrigin.INTERNAL,
    mediaId,
  };
}

/**
 * Creates the StoredFile of a Media inside the transaction that creates or
 * updates the Media itself. A failed or refused write therefore leaves neither
 * bytes nor a row.
 */
export function createStoredFileForMedia(
  tx: Prisma.TransactionClient,
  mediaId: string,
  location: StoredFileLocation,
) {
  return tx.storedFile.create({
    data: mediaStoredFileCreateData(mediaId, location),
  });
}

/**
 * Writes the location fields a batch has kept true — a metadata run's size,
 * content type and checksum, or a rendition run's new key and provider
 * address — inside the transaction that writes the Media itself.
 */
export function updateStoredFileForMedia(
  tx: Prisma.TransactionClient,
  mediaId: string,
  location: Prisma.StoredFileUpdateInput,
) {
  return tx.storedFile.update({ where: { mediaId }, data: location });
}
