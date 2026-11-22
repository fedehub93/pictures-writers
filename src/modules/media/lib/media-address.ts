import type { Prisma } from "@/generated/prisma";

import { storedFilePath } from "./file-path";
import {
  buildMediaDeliveryUrl,
  type MediaManifestRendition,
} from "./manifest";
import { mediaRenditionLocations } from "./renditions";

/**
 * The Media columns a delivery address is composed from: the stored-file
 * record's key, and the rendition manifest the bytes were written with. Archive
 * state and revision stay on the role row; no storage column remains.
 */
export const mediaAddressSelect = {
  revision: true,
  archivedAt: true,
  renditions: true,
  storedFile: { select: { key: true } },
} satisfies Prisma.MediaSelect;

export type MediaAddressRow = Prisma.MediaGetPayload<{
  select: typeof mediaAddressSelect;
}>;

/**
 * The key a Media's original lives under. The stored-file record is the only
 * answer; a Media without one has no address.
 */
export function mediaAddressKey(
  row: Pick<MediaAddressRow, "storedFile">,
): string | null {
  return row.storedFile?.key ?? null;
}

/**
 * The rendition addresses a Media row's manifest carries. Each entry recorded
 * the address its bytes were given at write time; an entry without one cannot
 * be delivered, so it is left out rather than invented.
 */
export function mediaRenditionAddresses(
  row: Pick<MediaAddressRow, "renditions">,
): MediaManifestRendition[] {
  const addresses: MediaManifestRendition[] = [];

  for (const rendition of mediaRenditionLocations(row.renditions)) {
    if (!rendition.url) continue;

    addresses.push({
      url: rendition.url,
      width: rendition.width,
      format: rendition.format,
    });
  }

  return addresses;
}

/**
 * The canonical address of a stored file, from its key and role. One function
 * builds the path and the rendition token, so the row address and a content
 * address can never disagree on the shape.
 */
export function composeMediaAddress(
  key: string,
  input: {
    revision: number;
    archived: boolean;
    renditions: MediaManifestRendition[];
  },
): string {
  return buildMediaDeliveryUrl(storedFilePath("MEDIA", key), input);
}

/**
 * The canonical delivery address of a Media: its stored-file key under
 * `/media/`, plus the rendition token the image loader reads.
 */
export function mediaDeliveryAddress(
  row: Pick<
    MediaAddressRow,
    "storedFile" | "revision" | "archivedAt" | "renditions"
  >,
): string {
  const key = mediaAddressKey(row);
  if (!key) return "";

  return composeMediaAddress(key, {
    revision: row.revision,
    archived: row.archivedAt !== null,
    renditions: mediaRenditionAddresses(row),
  });
}

/**
 * The provider address of one rendition, read from the manifest entry that
 * names its key. Delivery redirects a remote rendition through this, so it
 * never asks the provider to resolve a key.
 */
export function mediaRenditionAddress(
  row: Pick<MediaAddressRow, "renditions">,
  key: string,
): string | null {
  return (
    mediaRenditionLocations(row.renditions).find(
      (rendition) => rendition.key === key,
    )?.url ?? null
  );
}

/**
 * The projection a content surface needs: the address composer's columns plus
 * the identity and facts a card renders. A caller maps it through
 * `withMediaUrl`, so the composer's inputs never reach a component.
 */
export const mediaPresentationSelect = {
  ...mediaAddressSelect,
  id: true,
  altText: true,
  metadata: true,
} satisfies Prisma.MediaSelect;

/**
 * One Media projection for a caller that returns rows to the UI: the composed
 * `url` replaces the columns it was built from, so no storage key list or
 * rendition manifest reaches a component. The returned shape keeps the
 * presentation fields the caller selected.
 */
export function withMediaUrl<T extends MediaAddressRow>(
  row: T,
): Omit<T, "storedFile" | "renditions" | "revision" | "archivedAt"> & {
  url: string;
} {
  const {
    storedFile: _record,
    renditions: _renditions,
    revision: _revision,
    archivedAt: _archivedAt,
    ...rest
  } = row;

  return { ...rest, url: mediaDeliveryAddress(row) };
}
