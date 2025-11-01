import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Euro, Sofa } from "lucide-react";

import Image from "next/image";

import { Separator } from "@/components/ui/separator";

import {
  getPublishedProductBySlug,
  getPublishedProductsBuilding,
} from "@/data/product";

import { getProductMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";

import SubmissionForm from "./_components/submission-form";

import { isWebinarMetadata } from "@/type-guards";
import { formatDate } from "@/lib/format";
import { db } from "@/lib/db";
import { getLessonRange } from "@/data/webinars";

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
        <div className="col-span-full w-full py-6 md:py-10 pb-28 flex flex-col md:flex-row gap-y-8 gap-x-8 px-4 xl:px-0">
          <div className="w-full md:w-3/5">
            <SubmissionForm rootId={product.rootId!} form={form} />
          </div>
          <div className="w-full md:w-2/5">
            {/* <SubmitReview /> */}
            <div className="w-full flex flex-col gap-y-4">
              <div className="text-2xl font-semibold">Riepilogo</div>
              <div className="bg-card border rounded-lg p-6 w-full flex flex-col space-y-4 shadow-lg">
                <div className="flex flex-col items-center w-full space-y-2">
                  {product.imageCover?.url && (
                    <Image
                      src={product.imageCover?.url}
                      alt={product.imageCover?.altText || ""}
                      width={500}
                      height={500}
                      className="aspect-video object-cover"
                    />
                  )}
                  <div className="font-semibold text-lg">{product.title}</div>
                </div>
                <Separator />
                {isWebinarMetadata(product.metadata) && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex">
                      <div className="flex gap-x-2 w-1/2">
                        <Sofa className="size-5" strokeWidth={1.5} />
                        <div className="flex flex-col">
                          <div className="flex gap-x-4 font-semibold">
                            Posti
                          </div>
                          <span className="text-muted-foreground">
                            {product.metadata.seats}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-x-2">
                        <Euro className="size-5" strokeWidth={1.5} />
                        <div className="flex flex-col">
                          <div className="flex gap-x-4 font-semibold">
                            Prezzo
                          </div>
                          <span className="text-muted-foreground">
                            {product.price}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    {Array.isArray(product.metadata.lessons) &&
                      product.metadata.lessons.length > 0 && (
                        <div className="flex flex-col space-y-2">
                          <div className="flex gap-x-2 items-center mb-1">
                            <CalendarDays
                              className="size-5"
                              strokeWidth={1.5}
                            />
                            <div className="font-semibold">
                              Calendario lezioni
                            </div>
                          </div>

                          {(() => {
                            const { start, end } = getLessonRange(
                              product.metadata.lessons
                            );
                            if (!start || !end) return null;
                            return (
                              <div className="text-sm text-muted-foreground mb-2">
                                Dal{" "}
                                <span className="text-foreground font-medium">
                                  {formatDate({ date: start, month: "long" })}
                                </span>{" "}
                                al{" "}
                                <span className="text-foreground font-medium">
                                  {formatDate({ date: end, month: "long" })}
                                </span>
                              </div>
                            );
                          })()}

                          {/* Elenco dettagliato */}
                          <ul className="space-y-1 border-t pt-2 text-sm">
                            {product.metadata.lessons.map(
                              (lesson: any, index: number) => (
                                <li
                                  key={index}
                                  className="flex items-center justify-between"
                                >
                                  <div>
                                    <span className="text-foreground font-medium">
                                      {formatDate({
                                        date: lesson.date,
                                        month: "short",
                                      })}
                                    </span>{" "}
                                    · {lesson.startTime}–{lesson.endTime}
                                    {lesson.title && (
                                      <span className="italic text-muted-foreground ml-1">
                                        ({lesson.title})
                                      </span>
                                    )}
                                  </div>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Page;
