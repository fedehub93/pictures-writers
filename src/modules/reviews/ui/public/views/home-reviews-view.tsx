import { getPublishedReviews } from "../../../server/queries";

import { ReviewsSection } from "../reviews-section";

export const HomeReviewsView = async () => {
  const testimonials = await getPublishedReviews();

  return <ReviewsSection testimonials={testimonials} />;
};
