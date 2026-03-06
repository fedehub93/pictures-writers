import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";

import { ReviewsView } from "./components/reviews-view";

const ReviewsPage = async () => {
  await requireAdminAuth();

  const reviews = await db.reviews.findMany({
    select: {
      id: true,
      product: {
        select: {
          id: true,
          title: true,
          description: true,
          imageCover: {
            select: {
              url: true,
              altText: true,
            },
          },
        },
      },
      rating: true,
      reviewerName: true,
      comment: true,
      status: true,
      date: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return <ReviewsView reviews={reviews} />;
};

export default ReviewsPage;
