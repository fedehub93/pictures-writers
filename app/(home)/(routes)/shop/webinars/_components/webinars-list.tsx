import { ProductWithImageCoverAndAuthor } from "@/types";
import { isWebinarMetadata } from "@/type-guards";

import { WebinarCard } from "./webinar-card";

interface WebinarsListProps {
  webinars: (ProductWithImageCoverAndAuthor & {
    availableSeats: number;
  })[];
  totalPages: number;
  currentPage: number;
}

export const WebinarsList = async ({ webinars }: WebinarsListProps) => {
  return (
    <div className="flex flex-col items-center lg:items-start lg:flex-row mt-8">
      {webinars.map((webinar) => {
        if (!isWebinarMetadata(webinar.metadata)) return;

        return (
          <WebinarCard
            key={webinar.title}
            rootId={webinar.rootId!}
            title={webinar.title}
            categorySlug={webinar.category?.slug!}
            slug={webinar.slug}
            imageCover={webinar.imageCover}
            date={webinar.metadata.startDate}
            time={webinar.metadata.time}
            duration={webinar.metadata.duration}
            seats={webinar.metadata.seats}
            price={webinar.price!}
          />
        );
      })}
    </div>
  );
};
