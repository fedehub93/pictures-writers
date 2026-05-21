import Link from "next/link";
import Image from "next/image";

import { formatPrice } from "@/lib/format";

interface EbookCardProps {
  title: string;
  categorySlug: string;
  slug: string;
  imageCover: {
    url: string;
    altText: string | null;
  } | null;
  authorFirstName: string | null;
  authorLastName: string | null;
  price: number | null;
  discountedPrice: number | null;
}

export const EbookCard = ({
  title,
  categorySlug,
  slug,
  imageCover,
  authorFirstName,
  authorLastName,
  price,
  discountedPrice,
}: EbookCardProps) => {
  const href = `/shop/ebooks/${slug}` as const;
  return (
    <div
      key={title}
      className="flex flex-col justify-center items-center w-72 border rounded-lg overflow-hidden shadow-lg "
    >
      <div className="w-full border-b flex items-center justify-center group overflow-hidden">
        <Link
          href={href}
          className="group-hover:scale-105 transition-all duration-700 "
        >
          <Image
            src={imageCover?.url!}
            alt={imageCover?.altText!}
            className="shadow-md group-hover:shadow-xl transition-all duration-700"
            width={150}
            height={240}
          />
        </Link>
      </div>
      <div className="p-4 flex flex-col gap-y-2 text-center">
        <Link
          href={href}
          className="font-bold text-lg leading-5 hover:text-primary"
        >
          {title}
        </Link>
        <div className="text-xs text-muted-foreground">
          di {authorFirstName} {authorLastName}
        </div>
        <div className="flex flex-col text-xl font-extrabold">
          <div className="text-primary">{formatPrice(price!, true)}</div>
          {price !== discountedPrice && (
            <span className="text-xs line-through">
              {formatPrice(discountedPrice!, true)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
