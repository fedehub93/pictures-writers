import { ProductType } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export const getPublishedProductBySlug = async (slug: string) => {
  const root = await db.productRoot.findFirst({
    where: {
      slug,
      type: { not: ProductType.AFFILIATE },
    },
    include: {
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
      liveVersion: {
        include: {
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
          seo: {
            select: {
              title: true,
              description: true,
              canonicalUrl: true,
            },
          },
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
        },
      },
    },
  });

  if (!root || !root.liveVersion) {
    return null;
  }

  const version = root.liveVersion;
  const reviewCount = root.reviews.length;
  const aggregateRating =
    reviewCount > 0
      ? {
          ratingValue:
            root.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount,
          bestRating: Math.max(...root.reviews.map((r) => r.rating)),
          ratingCount: reviewCount,
        }
      : undefined;

  return {
    ...version,
    rootId: root.id,
    slug: root.slug,
    reviews: root.reviews,
    aggregateRating,
  };
};

export type GetPublishedProductBySlug = Awaited<
  ReturnType<typeof getPublishedProductBySlug>
>;
