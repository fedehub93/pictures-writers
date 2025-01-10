import { ContentStatus } from "@prisma/client";
import { db } from "./db";

export const createNewVersionProduct = async (rootId: string, values: any) => {
  // Trovo ultima versione pubblicata
  const publishedProduct = await db.product.findFirst({
    where: {
      rootId,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedProduct) {
    return { message: "Product not found", status: 404, product: null };
  }

  // Creo nuova versione
  const product = await db.product.create({
    data: {
      title: values.title || publishedProduct.title,
      description: values.description || publishedProduct.description,
      slug: values.slug || publishedProduct.slug,
      type: publishedProduct.type,
      price: values.price || publishedProduct.price,
      version: publishedProduct.version + 1,
      status: ContentStatus.CHANGED,
      isLatest: false,
    },
  });

  const updatedProduct = await db.product.update({
    where: { id: product.id },
    data: {
      ...publishedProduct,
      ...values,
      id: undefined,
      version: undefined,
      status: undefined,
      isLatest: undefined,
      seo: undefined,
      gallery: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });

  await db.productGallery.deleteMany({
    where: { productId: updatedProduct.id },
  });

  await db.productGallery.createMany({
    data: values.gallery.map((v: { mediaId: string; sort: number }) => ({
      productId: product.id,
      mediaId: v.mediaId,
      sort: v.sort,
    })),
  });

  if (updatedProduct.seoId && values.seo) {
    await db.seo.update({
      where: { id: updatedProduct.seoId },
      data: { ...values.seo },
    });
  }

  return { message: "", status: 200, product: updatedProduct };
};
