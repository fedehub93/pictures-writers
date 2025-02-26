import Image from "next/image";
import Link from "next/link";

import { WidgetProductType } from "@/types";
import { getWidgetProducts } from "@/data/widget";
import { ProductType } from "@prisma/client";
import { CalendarDays, Clock, Euro, Hourglass, Sofa } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/format";
import { isWebinarMetadata } from "@/type-guards";

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
    <div className="w-full bg-white px-6 pt-8 pb-2 shadow-md flex flex-col gap-y-2">
      <h3 className="mb-4 text-sm font-extrabold uppercase">{label}</h3>

      <div className="flex flex-col">
        {productData.map((product) => {
          return (
            <div key={product.title}>
              <Link
                key={product.title}
                href={`/ebooks/${product.slug}`}
                className="flex items-center md:items-start text-gray-600  flex-col group gap-y-2 mb-4"
                prefetch={true}
              >
                {product.imageCover ? (
                  <Image
                    src={product.imageCover?.url!}
                    alt="eBook gratuito sull'introduzione alla sceneggiatura cinematografica"
                    width={200}
                    height={400}
                    sizes="(max-width: 1280px) 90vw, 20vw"
                    className="mx-auto w-4/5 group-hover:scale-[1.02] group-hover:shadow-lg duration-700"
                    quality={75}
                  />
                ) : null}
              </Link>
              {product.type === ProductType.WEBINAR &&
                isWebinarMetadata(product.metadata) && (
                  <div className="flex flex-col gap-y-2 text-sm text-muted-foreground">
                    <div className="grid grid-cols-2 gap-x-4 ">
                      <div className="flex items-center gap-x-2">
                        <CalendarDays className="w-4 h-4" />
                        {formatDate({
                          date: product.metadata.date!,
                        })}
                      </div>
                      <div className="flex items-center gap-x-2">
                        <Clock className="h-4 w-4" />
                        Ora: {product.metadata.time}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                      <div className="flex items-center gap-x-2">
                        <Hourglass className="w-4 h-4" />
                        Durata: {product.metadata.duration}
                      </div>
                      <div className="flex items-center gap-x-2">
                        <Sofa className="h-4 w-4" />
                        Posti: {product.metadata.seats}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                      <div className="flex items-center gap-x-2">
                        <Euro className="h-4 w-4" />
                        Costo: {formatPrice(product.price!, true)}
                      </div>
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
