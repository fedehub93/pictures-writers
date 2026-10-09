import "server-only";

import { Prisma, type Seo } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import type { ProductUpdateSeoValues } from "../schemas";

import { ProductError } from "./errors";
import { acquireProductRootLock } from "./lock-root-products";
import {
  cloneProductSeo,
  createProductVersionSeo,
  type ProductSeoOverrides,
} from "./product-seo";
import { forkProductVersion, type CurrentVersion } from "./save-product";

/**
 * Apply an SEO edit to the current revision of a Product root.
 *
 * - A non-live current revision is updated in place, so editing SEO on a draft
 *   does not spawn a new content revision.
 * - A live current revision is forked into a new `CHANGED` revision carrying a
 *   cloned SEO row (with the edit applied), so the live shop keeps serving the
 *   old metadata until the staged revision is published.
 * - If the current revision's SEO is shared with another revision (older data),
 *   the SEO is cloned before editing so the edit cannot leak into the version it
 *   was shared with.
 *
 * The `ProductRoot` is locked for the duration so a concurrent publish cannot
 * interleave between reading the live pointer and forking.
 */
export async function updateProductVersionSeo(
  input: ProductUpdateSeoValues,
): Promise<Seo> {
  const { id, rootId, ...overrides } = input;

  return db.$transaction(async (tx) => {
    await acquireProductRootLock(tx, rootId);

    const root = await tx.productRoot.findUnique({ where: { id: rootId } });
    if (!root) {
      throw new ProductError("NOT_FOUND", "Product not found");
    }

    const current = await tx.productVersion.findFirst({
      where: { id, rootId },
      include: { gallery: true, extras: true, faqs: true },
    });
    if (!current) {
      throw new ProductError("NOT_FOUND", "Product not found");
    }

    if (root.liveVersionId === current.id) {
      const seo = await resolveSeo(tx, current, overrides);

      await forkProductVersion(tx, {
        root,
        current,
        input: { id, rootId },
        title: current.title,
        slug: root.slug,
        seoId: seo.id,
      });

      return seo;
    }

    const sharedWithAnotherVersion = current.seoId
      ? await tx.productVersion.count({
          where: { seoId: current.seoId, id: { not: current.id } },
        })
      : 0;

    if (current.seoId && sharedWithAnotherVersion === 0) {
      return tx.seo.update({
        where: { id: current.seoId },
        data: overrides,
      });
    }

    const seo = await resolveSeo(tx, current, overrides);

    await tx.productVersion.update({
      where: { id: current.id },
      data: { seoId: seo.id },
    });

    return seo;
  });
}

/**
 * Clone the version's SEO (or create one when it has none). A missing SEO can
 * only be transient, but the helper keeps the fork and clone paths uniform.
 */
async function resolveSeo(
  tx: Prisma.TransactionClient,
  current: CurrentVersion,
  overrides: ProductSeoOverrides,
): Promise<Seo> {
  const seo = current.seoId
    ? await cloneProductSeo(tx, current.seoId, overrides)
    : await createProductVersionSeo(
        tx,
        current.title,
        overrides,
        current.imageCoverId,
      );

  if (!seo) {
    throw new ProductError("NOT_FOUND", "Product not found");
  }

  return seo;
}
