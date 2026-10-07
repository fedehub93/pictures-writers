import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ProductDetailView,
  getProductMetadataBySlug,
  getPublishedProductBySlug,
  getPublishedProductsBuilding,
} from "@/modules/shop/products";

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getPublishedProductsBuilding();

  return [
    ...products
      .filter((p) => p.category)
      .map((p) => ({
        categorySlug: p.category?.slug,
        productSlug: p.slug,
      })),
  ];
}

export async function generateMetadata(
  props: PageProps<"/shop/[categorySlug]/[productSlug]">,
): Promise<Metadata | null> {
  const { productSlug } = await props.params;

  return await getProductMetadataBySlug(productSlug);
}

const Page = async (props: PageProps<"/shop/[categorySlug]/[productSlug]">) => {
  const { productSlug } = await props.params;

  const product = await getPublishedProductBySlug(productSlug);

  if (!product || !product.category) {
    return notFound();
  }

  return <ProductDetailView product={product} />;
};

export default Page;
