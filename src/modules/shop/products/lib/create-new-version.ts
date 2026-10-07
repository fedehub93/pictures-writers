import { ContentStatus, Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import type { ProductUpdateValues } from "../schemas";

export const PRODUCT_NOT_FOUND = "PRODUCT_NOT_FOUND";
export const PRODUCT_METADATA_MISMATCH = "PRODUCT_METADATA_MISMATCH";

const nullableJson = <T>(value: T | null): T | typeof Prisma.JsonNull =>
  value === null ? Prisma.JsonNull : value;

/**
 * Blog-aligned versioning: editing a published root forks a new `CHANGED`
 * version (kept offline) carrying over its gallery and FAQ, while editing a
 * draft updates it in place. The decision lives here, on the server, and never
 * dereferences inputs that were not provided.
 */
export const createNewVersion = async (input: ProductUpdateValues) => {
  return db.$transaction(async (tx) => {
    const latestProduct = await tx.product.findFirst({
      where: { rootId: input.rootId },
      include: { gallery: true, faqs: true },
      orderBy: { createdAt: "desc" },
    });

    if (!latestProduct) {
      throw new Error(PRODUCT_NOT_FOUND);
    }

    if (input.metadata && input.metadata.type !== latestProduct.type) {
      throw new Error(PRODUCT_METADATA_MISMATCH);
    }

    let productToUpdate = latestProduct;

    if (latestProduct.status === ContentStatus.PUBLISHED) {
      productToUpdate = await tx.product.create({
        data: {
          title: latestProduct.title,
          slug: latestProduct.slug,
          description: latestProduct.description,
          tiptapDescription: nullableJson(latestProduct.tiptapDescription),
          type: latestProduct.type,
          version: latestProduct.version + 1,
          status: ContentStatus.CHANGED,
          isLatest: false,
          firstPublishedAt: latestProduct.firstPublishedAt,
          acquisitionMode: latestProduct.acquisitionMode,
          price: latestProduct.price,
          discountedPrice: latestProduct.discountedPrice,
          isFree: latestProduct.isFree,
          metadata: nullableJson(latestProduct.metadata),
          ...(latestProduct.imageCoverId
            ? { imageCover: { connect: { id: latestProduct.imageCoverId } } }
            : {}),
          ...(latestProduct.categoryId
            ? { category: { connect: { id: latestProduct.categoryId } } }
            : {}),
          ...(latestProduct.formId
            ? { form: { connect: { id: latestProduct.formId } } }
            : {}),
          user: latestProduct.userId
            ? { connect: { id: latestProduct.userId } }
            : undefined,
          root: { connect: { id: input.rootId } },
          seo: latestProduct.seoId
            ? { connect: { id: latestProduct.seoId } }
            : undefined,
          gallery: {
            create: latestProduct.gallery.map((item) => ({
              mediaId: item.mediaId,
              sort: item.sort,
            })),
          },
          faqs: {
            create: latestProduct.faqs.map((faq) => ({
              question: faq.question,
              answer: faq.answer,
              sort: faq.sort,
            })),
          },
        },
        include: { gallery: true, faqs: true },
      });
    }

    const data: Prisma.ProductUpdateInput = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.tiptapDescription !== undefined)
      data.tiptapDescription = input.tiptapDescription;
    if (input.acquisitionMode !== undefined)
      data.acquisitionMode = input.acquisitionMode;
    if (input.price !== undefined) data.price = input.price;
    if (input.discountedPrice !== undefined)
      data.discountedPrice = input.discountedPrice;
    if (input.isFree !== undefined) data.isFree = input.isFree;
    if (input.metadata !== undefined)
      data.metadata = input.metadata as unknown as PrismaJson.ProductMetadata;
    if (input.categoryId !== undefined) {
      data.category = input.categoryId
        ? { connect: { id: input.categoryId } }
        : { disconnect: true };
    }
    if (input.imageCoverId !== undefined) {
      data.imageCover = input.imageCoverId
        ? { connect: { id: input.imageCoverId } }
        : { disconnect: true };
    }
    if (input.formId !== undefined) {
      data.form = input.formId
        ? { connect: { id: input.formId } }
        : { disconnect: true };
    }

    const updated = await tx.product.update({
      where: { id: productToUpdate.id },
      data,
    });

    if (input.gallery !== undefined) {
      await tx.productGallery.deleteMany({ where: { productId: updated.id } });
      if (input.gallery.length > 0) {
        await tx.productGallery.createMany({
          data: input.gallery.map((item) => ({
            productId: updated.id,
            mediaId: item.mediaId,
            sort: item.sort,
          })),
        });
      }
    }

    if (input.faqs !== undefined) {
      await tx.faq.deleteMany({ where: { productId: updated.id } });
      if (input.faqs.length > 0) {
        await tx.faq.createMany({
          data: input.faqs.map((faq) => ({
            productId: updated.id,
            question: faq.question ?? "",
            answer: faq.answer ?? "",
            sort: faq.sort,
          })),
        });
      }
    }

    return updated;
  });
};
