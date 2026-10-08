import "server-only";

import type { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { PageError } from "./errors";
import { acquirePageRootLock } from "./lock-page-root";

/**
 * Whether any row other than the page versions we are deleting still points at
 * this SEO record. Covers every model that owns a `seoId` so deleting a page
 * never removes metadata another entity depends on.
 */
async function seoIsReferenced(
  tx: Prisma.TransactionClient,
  seoId: string,
): Promise<boolean> {
  const [
    pageVersions,
    posts,
    categories,
    tags,
    products,
    productCategories,
    settings,
  ] = await Promise.all([
    tx.pageVersion.count({ where: { seoId } }),
    tx.post.count({ where: { seoId } }),
    tx.category.count({ where: { seoId } }),
    tx.tag.count({ where: { seoId } }),
    tx.product.count({ where: { seoId } }),
    tx.productCategory.count({ where: { seoId } }),
    tx.settings.count({ where: { seoId } }),
  ]);

  return (
    pageVersions +
      posts +
      categories +
      tags +
      products +
      productCategories +
      settings >
    0
  );
}

export interface DeletePageRootInput {
  /** Id of any version of the page; the whole root is removed. */
  versionId: string;
}

export interface DeletePageRootResult {
  id: string;
  slug: string;
}

/**
 * Delete a logical page: its `PageRoot`, every `PageVersion` (cascade) and the
 * SEO rows that belonged to those versions. SEO rows still referenced by
 * another entity are left intact; any SEO left with no owner is deleted.
 */
export async function deletePageRoot({
  versionId,
}: DeletePageRootInput): Promise<DeletePageRootResult> {
  return db.$transaction(async (tx) => {
    const version = await tx.pageVersion.findUnique({
      where: { id: versionId },
      select: { rootId: true, root: { select: { slug: true } } },
    });

    if (!version) {
      throw new PageError("NOT_FOUND", "Page not found");
    }

    const rootId = version.rootId;
    const slug = version.root.slug;

    await acquirePageRootLock(tx, rootId);

    const versions = await tx.pageVersion.findMany({
      where: { rootId },
      select: { seoId: true },
    });

    const seoIds = [
      ...new Set(
        versions
          .map((row) => row.seoId)
          .filter((seoId): seoId is string => Boolean(seoId)),
      ),
    ];

    await tx.pageRoot.delete({ where: { id: rootId } });

    for (const seoId of seoIds) {
      if (!(await seoIsReferenced(tx, seoId))) {
        await tx.seo.delete({ where: { id: seoId } });
      }
    }

    return { id: rootId, slug };
  });
}
