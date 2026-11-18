import "server-only";

import type { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { parentKeyPrefix, parseMediaKey } from "./media-key";

export const deliveryMediaSelect = {
  id: true,
  key: true,
  mimeType: true,
  storageDriver: true,
} satisfies Prisma.MediaSelect;

export type DeliveryMedia = Prisma.MediaGetPayload<{
  select: typeof deliveryMediaSelect;
}>;

/**
 * Resolves the Media that owns a delivery key.
 *
 * An original is stored on the row. A rendition shares its revision prefix but
 * has no row of its own, so its owner is looked up from the parsed key and the
 * revision must match the row. The requested key is the only input; ownership
 * is proved against the row's own prefix rather than trusted.
 */
export async function findDeliveryMedia(
  key: string,
): Promise<DeliveryMedia | null> {
  const exact = await db.media.findFirst({
    where: { key },
    select: deliveryMediaSelect,
  });
  if (exact) return exact;

  const parts = parseMediaKey(key);
  if (!parts) return null;

  const media = await db.media.findFirst({
    where: { id: parts.mediaId, revision: parts.revision },
    select: deliveryMediaSelect,
  });
  if (!media?.key) return null;

  return key.startsWith(`${parentKeyPrefix(media.key)}/`) ? media : null;
}
