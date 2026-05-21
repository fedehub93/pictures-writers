import { db } from "@/lib/db";
import { ReviewsSection } from "./reviews-section";

export const ReviewsView = async () => {
  const testimonials = await db.reviews.findMany({
    where: {
      status: true,
    },
    select: {
      id: true,
      reviewerName: true,
      role: true,
      rating: true,
      comment: true,
      date: true,
      verifiedPurchase: true,
    },
    take: 4,
    orderBy: { date: "desc" },
  });
  return <ReviewsSection testimonials={testimonials} />;
};
