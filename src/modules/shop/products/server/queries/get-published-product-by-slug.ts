import { ContentStatus, ProductType } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export const getPublishedProductBySlug = async (slug: string) => {
  const product = await db.product.findFirst({
    where: {
      slug,
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      type: { not: ProductType.AFFILIATE },
    },
    select: {
      id: true,
      rootId: true,
      title: true,
      tiptapDescription: true,
      slug: true,
      category: {
        select: {
          title: true,
          description: true,
          slug: true,
        },
      },
      imageCover: {
        select: {
          url: true,
          altText: true,
        },
      },
      formId: true,
      gallery: {
        select: {
          media: {
            select: {
              id: true,
              url: true,
              altText: true,
            },
          },
          sort: true,
        },
      },
      metadata: true,
      price: true,
      discountedPrice: true,
      seo: {
        select: {
          title: true,
          description: true,
          canonicalUrl: true,
        },
      },
      acquisitionMode: true,
      faqs: {
        select: {
          question: true,
          answer: true,
        },
        orderBy: {
          sort: "asc",
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      reviews: {
        select: {
          id: true,
          reviewerName: true,
          role: true,
          rating: true,
          comment: true,
          date: true,
          verifiedPurchase: true,
        },
        orderBy: {
          date: "desc",
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!product) {
    return null;
  }

  const reviewCount = product.reviews.length;
  const aggregateRating =
    reviewCount > 0
      ? {
          ratingValue:
            product.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount,
          bestRating: Math.max(...product.reviews.map((r) => r.rating)),
          ratingCount: reviewCount,
        }
      : undefined;

  return { ...product, aggregateRating };
};

export type GetPublishedProductBySlug = Awaited<
  ReturnType<typeof getPublishedProductBySlug>
>;
