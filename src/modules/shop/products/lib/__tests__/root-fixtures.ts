import { randomUUID } from "node:crypto";

import {
  ContentStatus,
  ProductAcquisitionMode,
  ProductType,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";

/**
 * Test helpers for building `ProductRoot` / `ProductVersion` fixtures directly,
 * bypassing the router when a suite only needs a given shape. Durable references
 * (reviews, order items, purchases) name the returned `root.id`; editorial
 * content lives on `version`. Deleting the root cascades its versions, gallery,
 * extras, FAQs, and its SEO is cleaned up separately by the caller.
 */
export interface CreateProductRootOptions {
  title?: string;
  slug?: string;
  price?: number | null;
  type?: ProductType;
  acquisitionMode?: ProductAcquisitionMode;
  formId?: string | null;
  /** When true (default) the version is the root's live version. */
  published?: boolean;
}

export async function createProductRoot(
  options: CreateProductRootOptions = {},
) {
  const published = options.published ?? true;

  const root = await db.productRoot.create({
    data: {
      slug: options.slug ?? `product-${randomUUID()}`,
      type: options.type ?? ProductType.SERVICE,
      firstPublishedAt: published ? new Date() : null,
    },
  });

  const version = await db.productVersion.create({
    data: {
      rootId: root.id,
      version: 1,
      status: published ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
      title: options.title ?? `Product ${randomUUID()}`,
      price: options.price ?? null,
      acquisitionMode: options.acquisitionMode ?? ProductAcquisitionMode.PAID,
      formId: options.formId ?? null,
      publishedAt: published ? new Date() : null,
    },
  });

  const rootWithPointers = await db.productRoot.update({
    where: { id: root.id },
    data: {
      currentVersionId: version.id,
      liveVersionId: published ? version.id : null,
    },
  });

  return { root: rootWithPointers, version };
}
