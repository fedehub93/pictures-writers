import { db } from "@/shared/lib/db";

const PUBLISHED_REVIEWS_TAKE = 4;

/**
 * Published reviews rendered on the public home page.
 */
export const getPublishedReviews = async (take = PUBLISHED_REVIEWS_TAKE) => {
  return db.reviews.findMany({
    where: { status: true },
    select: {
      id: true,
      reviewerName: true,
      role: true,
      rating: true,
      comment: true,
      date: true,
      verifiedPurchase: true,
    },
    take,
    orderBy: { date: "desc" },
  });
};

export type PublishedReviews = Awaited<ReturnType<typeof getPublishedReviews>>;
