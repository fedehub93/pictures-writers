import "server-only";

import { db } from "@/shared/lib/db";

/**
 * Counts relational references to a Media.
 *
 * References embedded in JSON content (`puckData`, `tiptapBodyData`, email
 * HTML, `AdItem.imageUrl`) are opaque strings and deliberately not counted.
 */
export async function countMediaReferences(mediaId: string): Promise<number> {
  const counts = await countMediaReferencesFor([mediaId]);

  return counts.get(mediaId) ?? 0;
}

/**
 * Batch variant used by the library so a page of Media costs a fixed number of
 * queries instead of one fan-out per row.
 */
export async function countMediaReferencesFor(
  mediaIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (mediaIds.length === 0) return counts;

  for (const mediaId of mediaIds) counts.set(mediaId, 0);

  const increase = (mediaId: string | null, amount: number) => {
    if (!mediaId) return;
    counts.set(mediaId, (counts.get(mediaId) ?? 0) + amount);
  };

  const where = { in: mediaIds };

  const [
    postCovers,
    pageCovers,
    productCovers,
    galleryItems,
    seoImages,
    profileImages,
    impressionFiles,
  ] = await Promise.all([
    db.postVersion.groupBy({
      by: ["imageCoverId"],
      where: { imageCoverId: where },
      _count: { _all: true },
    }),
    db.pageVersion.groupBy({
      by: ["imageCoverId"],
      where: { imageCoverId: where },
      _count: { _all: true },
    }),
    db.productVersion.groupBy({
      by: ["imageCoverId"],
      where: { imageCoverId: where },
      _count: { _all: true },
    }),
    db.productGallery.groupBy({
      by: ["mediaId"],
      where: { mediaId: where },
      _count: { _all: true },
    }),
    db.seo.groupBy({
      by: ["ogTwitterImageId"],
      where: { ogTwitterImageId: where },
      _count: { _all: true },
    }),
    db.user.groupBy({
      by: ["profileImageId"],
      where: { profileImageId: where },
      _count: { _all: true },
    }),
    db.impression.groupBy({
      by: ["fileId"],
      where: { fileId: where },
      _count: { _all: true },
    }),
  ]);

  for (const group of postCovers) increase(group.imageCoverId, group._count._all);
  for (const group of pageCovers) increase(group.imageCoverId, group._count._all);
  for (const group of productCovers) {
    increase(group.imageCoverId, group._count._all);
  }
  for (const group of galleryItems) increase(group.mediaId, group._count._all);
  for (const group of seoImages) {
    increase(group.ogTwitterImageId, group._count._all);
  }
  for (const group of profileImages) {
    increase(group.profileImageId, group._count._all);
  }
  for (const group of impressionFiles) {
    increase(group.fileId, group._count._all);
  }

  return counts;
}
