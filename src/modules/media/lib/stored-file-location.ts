import type { Prisma } from "@/generated/prisma";

import { mediaSourceKey } from "./url";

/**
 * The columns every read of a stored file's location needs: the key the driver
 * addresses, the driver that owns it, the provider address when it is remote,
 * and the facts a library row renders. It lives outside `server/` so delivery,
 * the backfills, the quota and the admin library share one projection.
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
 * The Media columns an operation may read only while the one-time location
 * backfill has not created the row's record yet. Once the record exists, it
 * answers.
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
 * quota, the library and the audit.
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
