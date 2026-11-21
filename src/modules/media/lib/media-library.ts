import type { Prisma } from "@/generated/prisma";

import {
  mediaAddressSelect,
  mediaDeliveryAddress,
} from "./media-address";
import {
  storedFileLocationSelect,
  mediaStoredLocation,
} from "./stored-file-location";

/**
 * The Media columns the admin library reads that are not storage facts. The
 * storage facts — key, address, size, content type, checksum and driver — come
 * from the stored-file record and the one address composer, so there is no
 * second copy of them to drift.
 */
export const mediaLibrarySelect = {
  id: true,
  name: true,
  type: true,
  altText: true,
  revision: true,
  metadata: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MediaSelect;

/**
 * What a library surface renders: the Media identity plus the storage facts
 * the row no longer stores, composed from its stored-file record.
 */
export type MediaLibraryItem = Prisma.MediaGetPayload<{
  select: typeof mediaLibrarySelect;
}> & {
  key: string | null;
  url: string;
  size: number | null;
  mimeType: string | null;
  checksum: string | null;
  storageDriver: string | null;
};

/**
 * The library's read projection: the row, the columns the address composer
 * needs, and its stored-file record. The joined record is never exposed.
 */
export const mediaLibraryRowSelect = {
  ...mediaLibrarySelect,
  ...mediaAddressSelect,
  storedFile: { select: storedFileLocationSelect },
} satisfies Prisma.MediaSelect;

export type MediaLibraryRow = Prisma.MediaGetPayload<{
  select: typeof mediaLibraryRowSelect;
}>;

/**
 * The library row the admin sees. The stored-file record answers the key, size,
 * content type, checksum and driver, and the composed address answers the URL.
 * A Media without a record is a row the audit reports; it renders no storage
 * facts rather than reading a mirror that no longer exists.
 */
export function mediaLibraryItem(row: MediaLibraryRow): MediaLibraryItem {
  const { storedFile, renditions: _renditions, ...media } = row;
  const location = mediaStoredLocation(storedFile);

  return {
    ...media,
    url: mediaDeliveryAddress(row),
    key: location?.key ?? null,
    size: location?.size ?? null,
    mimeType: location?.contentType ?? null,
    checksum: location?.checksum ?? null,
    storageDriver: location?.driver ?? null,
  };
}

/** A library row plus its relational reference count for the current page. */
export interface MediaLibraryEntry extends MediaLibraryItem {
  usageCount: number;
}

/**
 * The fields a cover picker previews. The admin modal returns a full library
 * entry; a form only reads these three, so it does not depend on the storage
 * facts the row no longer stores.
 */
export type MediaCover = Pick<MediaLibraryItem, "id" | "url" | "altText">;

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
