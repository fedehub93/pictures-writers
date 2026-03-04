import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/format";
import {
  isEbookMetadata,
  isServiceMetadata,
  isWebinarMetadata,
} from "@/type-guards";

import { GetProductsPaginatedByFiltersReturn } from "@/data/product";

import { WebinarCard } from "./webinar-card";
import { EbookCard } from "./ebook-card";
import { ServiceCard } from "./service-card";

interface ProductsListProps {
  categorySlug: string;
  products: GetProductsPaginatedByFiltersReturn["products"];
}

export const ProductsList = ({ categorySlug, products }: ProductsListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((p) => {
        if (p.metadata && isWebinarMetadata(p.metadata)) {
          return (
            <WebinarCard
              key={p.title}
              rootId={p.rootId!}
              title={p.title}
              categorySlug={categorySlug}
              slug={p.slug}
              imageCover={p.imageCover}
              seats={p.metadata.seats}
              price={p.price!}
              discountedPrice={p.discountedPrice}
              lessons={p.metadata.lessons}
            />
          );
        }
        if (p.metadata && isEbookMetadata(p.metadata)) {
          return (
            <EbookCard
              key={p.title}
              title={p.title}
              categorySlug={categorySlug}
              slug={p.slug}
              imageCover={p.imageCover}
              authorFirstName={p.metadata.author?.firstName!}
              authorLastName={p.metadata.author?.lastName!}
              price={p.price!}
              discountedPrice={p.discountedPrice!}
            />
          );
        }
        if (p.metadata && isServiceMetadata(p.metadata)) {
          return (
            <ServiceCard
              key={p.title}
              title={p.title}
              categorySlug={categorySlug}
              slug={p.slug}
              serviceType={p.metadata.serviceType}
              target={p.metadata.target}
              competitorPrice={p.metadata.competitorPrice}
              features={p.metadata.features}
              price={p.price!}
            />
          );
        }

        const href = `/shop/${categorySlug}/${p.slug}/` as const;

        return (
          <div
            key={p.title}
            className="flex flex-col justify-center items-center w-72 rounded-lg overflow-hidden shadow-lg bg-primary-foreground"
          >
            <div className="w-full border-b flex items-center justify-center group overflow-hidden h-60">
              <Link
                href={href}
                prefetch
                className="group-hover:scale-105 transition-all duration-700 h-full"
              >
                <Image
                  src={p.imageCover?.url!}
                  alt={p.imageCover?.altText!}
                  className="shadow-md group-hover:shadow-xl transition-all duration-700 w-full h-full object-cover"
                  width={150}
                  height={150}
                />
              </Link>
            </div>
            <div className="p-4 flex flex-col gap-y-2 text-center h-40">
              <div className="font-bold text-lg leading-5">{p.title}</div>

              <div className="flex flex-col text-xl font-extrabold">
                <div className="text-primary">
                  {formatPrice(p.price!, true)}
                </div>
                {p.price !== p.discountedPrice && (
                  <span className="text-xs line-through">
                    {formatPrice(p.discountedPrice!, true)}
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
