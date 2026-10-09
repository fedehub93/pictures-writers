import "server-only";

import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { getDefaultProductMetadata } from "../lib/default-metadata";
import type { ProductInsertValues } from "../schemas";

import { createProductVersionSeo } from "./product-seo";

export interface CreateProductInput extends ProductInsertValues {
  userId: string;
}

/**
 * Create a logical product: a `ProductRoot` owning the stable slug and immutable
 * type, plus its first `DRAFT` `ProductVersion`. The version gets a self-owned
 * SEO row and immediately becomes the root's current version. Everything is
 * written in one transaction so a product can never exist half-built.
 */
export async function createProduct({
  title,
  slug,
  type,
  userId,
}: CreateProductInput) {
  return db.$transaction(async (tx) => {
    const root = await tx.productRoot.create({ data: { slug, type } });

    const version = await tx.productVersion.create({
      data: {
        rootId: root.id,
        version: 1,
        status: ContentStatus.DRAFT,
        title,
        metadata: getDefaultProductMetadata(type),
        userId,
      },
    });

    const seo = await createProductVersionSeo(tx, title, {
      noIndex: false,
      noFollow: false,
    });

    const versionWithSeo = await tx.productVersion.update({
      where: { id: version.id },
      data: { seoId: seo.id },
      include: { seo: true },
    });

    await tx.productRoot.update({
      where: { id: root.id },
      data: { currentVersionId: version.id },
    });

    return {
      ...versionWithSeo,
      slug: root.slug,
      rootId: root.id,
      type: root.type,
    };
  });
}
