import Image from "next/image";
import Link from "next/link";

import { WidgetProductType } from "@/types";
import { getWidgetProducts } from "@/data/widget";

interface WidgetProductProps {
  label: string;
  products: { id: string; sort: number }[];
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
                  quality={90}
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default WidgetProduct;
