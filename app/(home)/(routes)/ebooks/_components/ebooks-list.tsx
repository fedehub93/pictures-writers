import Link from "next/link";
import Image from "next/image";

import { EbookWithImageCoverAndAuthor, isEbookMetadata } from "@/lib/ebook";
import { formatPrice } from "@/lib/format";

interface EbooksListProps {
  ebooks: EbookWithImageCoverAndAuthor[];
  totalPages: number;
  currentPage: number;
}

export const EbooksList = ({ ebooks }: EbooksListProps) => {
  return (
    <div className="flex flex-col items-center lg:items-start lg:flex-row">
      {ebooks.map((ebook) => {
        if (!isEbookMetadata(ebook.metadata)) return;

        return (
          <div
            key={ebook.title}
            className="flex flex-col justify-center items-center w-72 border rounded-lg overflow-hidden shadow-lg "
          >
            <div className="w-full border-b flex items-center justify-center group overflow-hidden">
              <Link
                href={`/ebooks/${ebook.slug}`}
                className="group-hover:scale-105 transition-all duration-700 "
              >
                <Image
                  src={ebook.imageCover?.url!}
                  alt={ebook.imageCover?.altText!}
                  className="shadow-md group-hover:shadow-xl transition-all duration-700"
                  width={150}
                  height={400}
                />
              </Link>
            </div>
            <div className="p-4 flex flex-col gap-y-2 text-center">
              <Link
                href={`/ebooks/${ebook.slug}`}
                className="font-bold text-lg leading-5 hover:text-primary"
              >
                {ebook.title}
              </Link>
              <div className="text-xs text-muted-foreground">
                di {ebook.author?.firstName} {ebook.author?.lastName}
              </div>
              <div className="flex flex-col text-xl font-extrabold">
                <div className="text-primary">
                  {formatPrice(ebook.price!, true)}
                </div>
                {ebook.price !== ebook.discountedPrice && (
                  <span className="text-xs line-through">
                    {formatPrice(ebook.discountedPrice!, true)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
