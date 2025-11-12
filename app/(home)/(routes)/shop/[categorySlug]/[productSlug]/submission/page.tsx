import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";

import { isWebinarMetadata } from "@/type-guards";

import {
  getPublishedProductBySlug,
  getPublishedProductsBuilding,
} from "@/data/product";

import { getProductMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";

import SubmissionForm from "./_components/submission-form";
import { WebinarSummary } from "../_components/webinar/webinar-summary";

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
  props: PageProps<"/shop/[categorySlug]/[productSlug]/submission">
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
  const form = product.formId
    ? await db.form.findFirst({ where: { id: product.formId } })
    : null;

  if (!form) {
    return notFound();
  }

  return (
    <section key={product.slug} className="bg-background py-10">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 px-4 md:grid-cols-2 gap-x-12">
        <Breadcrumbs
          items={[
            { title: "Home", href: "/" },
            { title: "Shop", href: `/shop/` },
            {
              title: product.category.title,
              href: `/shop/${product.category.slug}/`,
            },
            {
              title: product.title,
              href: `/shop/${product.category.slug}/${productSlug}/`,
            },
            { title: "Submission" },
          ]}
        />
        <div className="col-span-full w-full py-6 md:py-10 pb-28 flex flex-col md:flex-row gap-y-8 gap-x-8 xl:px-0">
          <div className="w-full md:w-8/12">
            <SubmissionForm rootId={product.rootId!} form={form} />
          </div>
          <div className="w-full md:w-4/12">
            <div className="w-full flex flex-col gap-y-4">
              <div className="text-2xl font-medium">Riepilogo</div>
              {isWebinarMetadata(product.metadata) && (
                <WebinarSummary
                  id={product.id}
                  title={product.title}
                  image={product.imageCover}
                  acquisitionMode={product.acquisitionMode}
                  price={product.price}
                  discountedPrice={product.discountedPrice}
                  data={product.metadata}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Page;
