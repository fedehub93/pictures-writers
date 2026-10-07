import { ContentStatus, type Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import type { ProductCategoryUpdateValues } from "../schemas";

export const PRODUCT_CATEGORY_NOT_FOUND = "PRODUCT_CATEGORY_NOT_FOUND";

/**
 * Blog-aligned versioning: editing a published root forks a new `CHANGED`
 * version (kept offline), while editing a draft updates it in place. The
 * decision lives here, on the server, and never dereferences inputs that were
 * not provided.
 */
export const createNewVersion = async (
  input: ProductCategoryUpdateValues,
) => {
  return db.$transaction(async (tx) => {
    const latestCategory = await tx.productCategory.findFirst({
      where: { rootId: input.rootId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestCategory) {
      throw new Error(PRODUCT_CATEGORY_NOT_FOUND);
    }

    let categoryToUpdate = latestCategory;

    if (latestCategory.status === ContentStatus.PUBLISHED) {
      categoryToUpdate = await tx.productCategory.create({
        data: {
          title: latestCategory.title,
          slug: latestCategory.slug,
          description: latestCategory.description,
          version: latestCategory.version + 1,
          status: ContentStatus.CHANGED,
          isLatest: false,
          firstPublishedAt: latestCategory.firstPublishedAt,
          root: { connect: { id: input.rootId } },
          seo: latestCategory.seoId
            ? { connect: { id: latestCategory.seoId } }
            : undefined,
        },
      });
    }

    const data: Prisma.ProductCategoryUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;

    return tx.productCategory.update({
      where: { id: categoryToUpdate.id },
      data,
    });
  });
};
