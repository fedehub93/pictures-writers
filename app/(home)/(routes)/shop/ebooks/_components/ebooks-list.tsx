import { ProductWithImageCoverAndAuthor } from "@/types";
import { isEbookMetadata } from "@/type-guards";

import { EbookCard } from "./ebook-card";

interface EbooksListProps {
  ebooks: ProductWithImageCoverAndAuthor[];
  totalPages: number;
  currentPage: number;
}

export const EbooksList = ({ ebooks }: EbooksListProps) => {
  return (
    <div className="flex flex-col items-center lg:items-start lg:flex-row">
      {ebooks.map((ebook) => {
        if (!isEbookMetadata(ebook.metadata)) return null;

        return (
          <EbookCard
            key={ebook.title}
            title={ebook.title}
            categorySlug={ebook.category?.slug!}
            slug={ebook.slug}
            imageCover={ebook.imageCover}
            authorFirstName={ebook.metadata.author?.firstName!}
            authorLastName={ebook.metadata.author?.lastName!}
            price={ebook.price}
            discountedPrice={ebook.discountedPrice}
          />
        );
      })}
    </div>
  );
};
