import "server-only";

import type { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { ProductError } from "./errors";
import { acquireProductRootLock } from "./lock-root-products";

/**
 * Whether any row other than the product versions we are deleting still points
 * at this SEO record. Covers every model that owns a `seoId` so deleting a
 * product never removes metadata another entity depends on.
 */
async function seoIsReferenced(
  tx: Prisma.TransactionClient,
  seoId: string,
): Promise<boolean> {
  const [
    productVersions,
    postVersions,
    pageVersions,
    categories,
    tags,
    productCategories,
    settings,
  ] = await Promise.all([
    tx.productVersion.count({ where: { seoId } }),
    tx.postVersion.count({ where: { seoId } }),
    tx.pageVersion.count({ where: { seoId } }),
    tx.category.count({ where: { seoId } }),
    tx.tag.count({ where: { seoId } }),
    tx.productCategory.count({ where: { seoId } }),
    tx.settings.count({ where: { seoId } }),
  ]);

  return (
    productVersions +
      postVersions +
      pageVersions +
      categories +
      tags +
      productCategories +
      settings >
    0
  );
}

export interface DeleteProductRootInput {
  /** Id of the `ProductRoot` or of any of its versions. */
  id: string;
}

export interface DeleteProductRootResult {
  id: string;
  slug: string;
}

async function resolveRoot(
  tx: Prisma.TransactionClient,
  id: string,
): Promise<{ id: string; slug: string } | null> {
  const root = await tx.productRoot.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });

  if (root) return root;

  const version = await tx.productVersion.findUnique({
    where: { id },
    select: { root: { select: { id: true, slug: true } } },
  });

  return version?.root ?? null;
}

/**
 * Delete a logical product: its `ProductRoot`, every `ProductVersion` (cascade)
 * and the SEO rows that belonged to those versions. Editorial relations
 * (gallery, extras, FAQs) cascade with the versions. SEO rows still referenced
 * by another entity are left intact; any SEO left with no owner is deleted.
 */
export async function deleteProductRoot({
  id,
}: DeleteProductRootInput): Promise<DeleteProductRootResult> {
  return db.$transaction(async (tx) => {
    const root = await resolveRoot(tx, id);

    if (!root) {
      throw new ProductError("NOT_FOUND", "Product not found");
    }

    await acquireProductRootLock(tx, root.id);

    const versions = await tx.productVersion.findMany({
      where: { rootId: root.id },
      select: { seoId: true },
    });

    const seoIds = [
      ...new Set(
        versions
          .map((row) => row.seoId)
          .filter((seoId): seoId is string => Boolean(seoId)),
      ),
    ];

    await tx.productRoot.delete({ where: { id: root.id } });

    for (const seoId of seoIds) {
      if (!(await seoIsReferenced(tx, seoId))) {
        await tx.seo.delete({ where: { id: seoId } });
      }
    }

    return { id: root.id, slug: root.slug };
  });
}
