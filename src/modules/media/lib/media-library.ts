import type { Prisma } from "@/generated/prisma";

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
  metadata: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MediaSelect;

export type MediaLibraryItem = Prisma.MediaGetPayload<{
  select: typeof mediaLibrarySelect;
}>;

/** Which half of the library the admin is looking at. */
export type MediaLibraryView = "active" | "archived";

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
