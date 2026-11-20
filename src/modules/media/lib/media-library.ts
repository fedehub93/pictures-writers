import type { Prisma } from "@/generated/prisma";

import { storedFileLocationSelect, mediaStorageLocation } from "./stored-file-location";

/**
 * Projection used by every media-library surface. It deliberately omits
 * `renditions`: the manifest is derived data the admin never edits.
 */
export const mediaLibrarySelect = {
  id: true,
  name: true,
  key: true,
  url: true,
  size: true,
  type: true,
  altText: true,
  mimeType: true,
  checksum: true,
  revision: true,
  storageDriver: true,
  metadata: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MediaSelect;

export type MediaLibraryItem = Prisma.MediaGetPayload<{
  select: typeof mediaLibrarySelect;
}>;

/**
 * The library's read projection: the row plus its stored-file record, so the
 * storage facts the admin sees come from where the bytes are rather than from
 * the Media's mirror columns. `url` stays the Media's canonical address: the
 * record knows the key, and the address is composed from it.
 */
export const mediaLibraryRowSelect = {
  ...mediaLibrarySelect,
  storedFile: { select: storedFileLocationSelect },
} satisfies Prisma.MediaSelect;

export type MediaLibraryRow = Prisma.MediaGetPayload<{
  select: typeof mediaLibraryRowSelect;
}>;

/**
 * The library row the admin sees. A record answers the key, size, content
 * type, checksum and driver; the Media's own columns are read only for a row
 * whose record the one-time backfill has not created yet, so this code can
 * deploy before it without emptying a field.
 */
export function mediaLibraryItem(row: MediaLibraryRow): MediaLibraryItem {
  const { storedFile: _record, ...media } = row;
  const location = mediaStorageLocation(row);

  return {
    ...media,
    key: location.key,
    size: location.size,
    mimeType: location.contentType,
    checksum: location.checksum,
    storageDriver: location.driver,
  };
}

/** A library row plus its relational reference count for the current page. */
export interface MediaLibraryEntry extends MediaLibraryItem {
  usageCount: number;
}

export const MEDIA_USAGE_NOTE =
  "Used in counts relational references only. References embedded in rich text or page data are not counted.";

export function formatMediaDimensions(
  media: Pick<MediaLibraryItem, "metadata">,
): string | null {
  const width = media.metadata?.width;
  const height = media.metadata?.height;

  if (typeof width !== "number" || typeof height !== "number") return null;

  return `${width} × ${height}`;
}
