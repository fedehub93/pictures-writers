import { db } from "@/lib/db";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { ReviewsView } from "./components/reviews-view";

const ReviewsPage = async () => {
  await requirePermission(PERMISSIONS.REVIEWS_READ);

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
      role: true,
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
