import "server-only";

import {
  ContentStatus,
  Prisma,
  type ProductType,
  type ProductVersion,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import type { ProductUpdateValues } from "../schemas";

import { ProductError } from "./errors";
import { acquireProductRootLock } from "./lock-root-products";
import { cloneProductSeo } from "./product-seo";

export interface ProductVersionWithSlug extends ProductVersion {
  slug: string;
  type: ProductType;
}

export type CurrentVersion = Prisma.ProductVersionGetPayload<{
  include: { gallery: true; extras: true; faqs: true };
}>;

/**
 * Persist an edit to the current revision of a Product root.
 *
 * - When the current revision is not live, it is updated in place: a draft stays
 *   a single row while the editor iterates. Gallery, extras and FAQs are only
 *   replaced when the caller supplies them, so an isolated title edit never
 *   clears the editorial relations.
 * - When the current revision is live, the edit forks a new `CHANGED` revision
 *   carrying the content, gallery, extras, FAQs, category link and a self-owned
 *   clone of the SEO row, so the live shop keeps serving the published version
 *   until the change is published.
 *
 * The `ProductRoot` row is locked for the duration so a concurrent publish or
 * edit cannot interleave between reading the live pointer and forking.
 */
export async function saveProductVersion(
  input: ProductUpdateValues,
): Promise<ProductVersionWithSlug> {
  const { id, rootId } = input;

  if (!id || !rootId) {
    throw new ProductError("NOT_FOUND", "Product not found");
  }

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

    if (input.metadata && input.metadata.type !== root.type) {
      throw new ProductError("METADATA_MISMATCH", "Metadata type mismatch");
    }

    const title = input.title ?? current.title;
    const slug = input.slug ?? root.slug;

    if (root.liveVersionId === current.id) {
      const seoId = current.seoId
        ? (await cloneProductSeo(tx, current.seoId, {}))?.id ?? null
        : null;

      return forkProductVersion(tx, {
        root,
        current,
        input,
        title,
        slug,
        seoId,
      });
    }

    return updateInPlace(tx, { root, current, input, title, slug });
  });
}

export interface ForkProductVersionInput {
  root: { id: string; slug: string; type: ProductType };
  current: CurrentVersion;
  input: ProductUpdateValues;
  title: string;
  slug: string;
  seoId: string | null;
}

/**
 * Create a new `CHANGED` revision from a live one, carrying the content, the
 * editorial relations (or the caller's replacements) and the given SEO. Used by
 * both the content edit and the SEO edit paths so a staged change always forks
 * the same way. The caller must hold the root lock.
 */
export async function forkProductVersion(
  tx: Prisma.TransactionClient,
  { root, current, input, title, slug, seoId }: ForkProductVersionInput,
): Promise<ProductVersionWithSlug> {
  const latest = await tx.productVersion.aggregate({
    where: { rootId: root.id },
    _max: { version: true },
  });

  const forked = await tx.productVersion.create({
    data: {
      rootId: root.id,
      version: (latest._max.version ?? 0) + 1,
      status: ContentStatus.CHANGED,
      title,
      tiptapDescription: nullableJson(
        input.tiptapDescription !== undefined
          ? input.tiptapDescription
          : current.tiptapDescription,
      ),
      acquisitionMode: input.acquisitionMode ?? current.acquisitionMode,
      price: input.price !== undefined ? input.price : current.price,
      discountedPrice:
        input.discountedPrice !== undefined
          ? input.discountedPrice
          : current.discountedPrice,
      isFree: input.isFree !== undefined ? input.isFree : current.isFree,
      metadata: nullableJson(
        input.metadata !== undefined
          ? (input.metadata as unknown as PrismaJson.ProductMetadata)
          : current.metadata,
      ),
      imageCoverId:
        input.imageCoverId !== undefined
          ? input.imageCoverId
          : current.imageCoverId,
      categoryId:
        input.categoryId !== undefined ? input.categoryId : current.categoryId,
      formId: input.formId !== undefined ? input.formId : current.formId,
      userId: current.userId,
      seoId,
      gallery: { create: galleryToCreate(input, current) },
      extras: { create: extrasToCreate(input, current) },
      faqs: { create: faqsToCreate(input, current) },
    },
  });

  await tx.productRoot.update({
    where: { id: root.id },
    data: { currentVersionId: forked.id, slug },
  });

  return { ...forked, slug, type: root.type };
}

interface MutateContext {
  root: { id: string; slug: string; type: ProductType };
  current: CurrentVersion;
  input: ProductUpdateValues;
  title: string;
  slug: string;
}

/**
 * Update a non-live current revision in place. Relation edits only run when the
 * caller supplies them, so an isolated title edit never clears gallery, extras
 * or FAQs.
 */
async function updateInPlace(
  tx: Prisma.TransactionClient,
  { root, current, input, title, slug }: MutateContext,
): Promise<ProductVersionWithSlug> {
  await tx.productVersion.update({
    where: { id: current.id },
    data: {
      title,
      ...(input.tiptapDescription !== undefined && {
        tiptapDescription: input.tiptapDescription,
      }),
      ...(input.acquisitionMode !== undefined && {
        acquisitionMode: input.acquisitionMode,
      }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.discountedPrice !== undefined && {
        discountedPrice: input.discountedPrice,
      }),
      ...(input.isFree !== undefined && { isFree: input.isFree }),
      ...(input.metadata !== undefined && {
        metadata: input.metadata as unknown as PrismaJson.ProductMetadata,
      }),
      ...(input.imageCoverId !== undefined && {
        imageCoverId: input.imageCoverId,
      }),
      ...(input.categoryId !== undefined && {
        categoryId: input.categoryId,
      }),
      ...(input.formId !== undefined && { formId: input.formId }),
    },
  });

  if (input.gallery !== undefined) {
    await tx.productGallery.deleteMany({ where: { productId: current.id } });
    if (input.gallery.length > 0) {
      await tx.productGallery.createMany({
        data: input.gallery.map((item) => ({
          productId: current.id,
          mediaId: item.mediaId,
          sort: item.sort,
        })),
      });
    }
  }

  if (input.extras !== undefined) {
    await tx.productExtra.deleteMany({ where: { productId: current.id } });
    if (input.extras.length > 0) {
      await tx.productExtra.createMany({
        data: input.extras.map((extra) => ({
          productId: current.id,
          name: extra.name,
          description: extra.description ?? null,
          price: extra.price,
        })),
      });
    }
  }

  if (input.faqs !== undefined) {
    await tx.faq.deleteMany({ where: { productId: current.id } });
    if (input.faqs.length > 0) {
      await tx.faq.createMany({
        data: input.faqs.map((faq) => ({
          productId: current.id,
          question: faq.question ?? "",
          answer: faq.answer ?? "",
          sort: faq.sort,
        })),
      });
    }
  }

  if (slug !== root.slug) {
    await tx.productRoot.update({ where: { id: root.id }, data: { slug } });
  }

  const fresh = await tx.productVersion.findUniqueOrThrow({
    where: { id: current.id },
    include: { gallery: true, extras: true, faqs: true, seo: true },
  });

  return { ...fresh, slug, type: root.type };
}

/**
 * Normalise a JSON value for Prisma: `null` becomes `Prisma.JsonNull`, anything
 * else is passed through with its own type so the generated JSON types hold.
 */
function nullableJson<T>(value: T | null): T | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : value;
}

function galleryToCreate(input: ProductUpdateValues, current: CurrentVersion) {
  return input.gallery
    ? input.gallery.map((item) => ({ mediaId: item.mediaId, sort: item.sort }))
    : current.gallery.map((item) => ({
        mediaId: item.mediaId,
        sort: item.sort,
      }));
}

function extrasToCreate(input: ProductUpdateValues, current: CurrentVersion) {
  return input.extras
    ? input.extras.map((extra) => ({
        name: extra.name,
        description: extra.description ?? null,
        price: extra.price,
      }))
    : current.extras.map((extra) => ({
        name: extra.name,
        description: extra.description,
        price: extra.price,
      }));
}

function faqsToCreate(input: ProductUpdateValues, current: CurrentVersion) {
  return input.faqs
    ? input.faqs.map((faq) => ({
        question: faq.question ?? "",
        answer: faq.answer ?? "",
        sort: faq.sort,
      }))
    : current.faqs.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
        sort: faq.sort,
      }));
}
