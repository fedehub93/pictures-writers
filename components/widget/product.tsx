import Image from "next/image";
import Link from "next/link";
import { ProductType } from "@/prisma/generated/client";
import {
  CalendarDays,
  CalendarOff,
  Clock,
  Euro,
  Hourglass,
  Sofa,
} from "lucide-react";

import { WidgetProductType } from "@/types";
import { getWidgetProducts } from "@/data/widget";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/format";
import { isWebinarMetadata } from "@/type-guards";
import { cn } from "@/lib/utils";

interface WidgetProductProps {
  label: string;
  products: { rootId: string; sort: number }[];
  productType: WidgetProductType;
  limit: number;
}

export const WidgetProduct = async ({
  label,
  productType,
  products,
  limit,
}: WidgetProductProps) => {
  const productData = await getWidgetProducts({
    productType,
    products,
    limit,
  });

  return (
    <div className="w-full bg-white px-6 pt-8 pb-6 shadow-md flex flex-col gap-y-2">
      <h3 className="mb-2 text-sm font-extrabold uppercase">{label}</h3>

      <div className="flex flex-col">
        {productData
          .filter((p) => p.category)
          .map((product) => {
            const categorySlug = product.category!.slug as
              | "ebooks"
              | "webinars";

            return (
              <div key={product.title}>
                <Link
                  key={product.title}
                  href={`/shop/${categorySlug}/${product.slug}`}
                  className="flex items-center md:items-start text-gray-600  flex-col group mb-4"
                  prefetch
                >
                  {product.imageCover ? (
                    <Image
                      src={product.imageCover?.url!}
                      alt="eBook gratuito sull'introduzione alla sceneggiatura cinematografica"
                      width={200}
                      height={400}
                      sizes="(max-width: 1280px) 90vw, 20vw"
                      className="mx-auto w-full group-hover:scale-[1.02] group-hover:shadow-lg duration-700"
                      quality={75}
                    />
                  ) : null}
                </Link>
                {product.type === ProductType.WEBINAR &&
                  isWebinarMetadata(product.metadata) &&
                  "availableSeats" in product && (
                    <div className="flex flex-col gap-y-4 text-sm">
                      <div className="font-bold text-center text-lg leading-5 hover:text-primary">
                        {product.title}
                      </div>
                      <div className="flex flex-col flex-wrap gap-y-2 text-sm text-muted-foreground">
                        {/* <div className="grid grid-cols-2 gap-x-4 gap-y-2 ">
                          <div className="flex items-center gap-x-2">
                            <CalendarDays className="w-4 h-4" />
                            Inizio:{" "}
                            {formatDate({
                              date: product.metadata.startDate!,
                            })}
                          </div>
                          {!!product.metadata.time && (
                            <div className="flex items-center gap-x-2">
                              <Clock className="h-4 w-4" />
                              Ora: {product.metadata.time}
                            </div>
                          )}
                          {!!product.metadata.endDate && (
                            <div className="flex items-center gap-x-2">
                              <CalendarOff className="h-4 w-4" />
                              Fine:{" "}
                              {formatDate({
                                date: product.metadata.endDate,
                              })}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4">
                          <div className="flex items-center gap-x-2">
                            <Hourglass className="w-4 h-4" />
                            Durata: {product.metadata.duration}
                          </div>
                          <div className="flex items-center gap-x-2">
                            <Clock className="h-4 w-4" />
                            Lezioni: {product.metadata.lessons}
                          </div>
                        </div> */}
                        <div className="grid grid-cols-2 gap-x-4">
                          <div className="flex items-center gap-x-2">
                            <Sofa className="h-4 w-4" />
                            Posti: {product.metadata.seats}
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-x-2 text-primary underline font-semibold",
                              product.availableSeats < 1 && "text-destructive"
                            )}
                          >
                            <Sofa className="h-4 w-4" />
                            Disponibili: {product.availableSeats}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4">
                          <div className="flex items-center gap-x-2">
                            <Euro className="h-4 w-4" />
                            Costo: {formatPrice(product.price!, true)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col text-xl font-extrabold mt-2">
                        {product.availableSeats ? (
                          <Button
                            asChild
                            size="sm"
                            className="w-1/2 self-center"
                          >
                            <Link
                              href={`/shop/${categorySlug}/${product.slug}`}
                            >
                              Scopri
                            </Link>
                          </Button>
                        ) : null}
                        {!product.availableSeats && (
                          <div className="text-white self-center text-center w-3/4 text-2xl font-bold bg-destructive p-1 px-2 rounded-md">
                            Posti esauriti
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default WidgetProduct;
