"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";
import { Descendant } from "slate";
import {
  ContentStatus,
  Media,
  Product,
  ProductType,
  User,
  Seo,
} from "@prisma/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { StatusView } from "@/app/(admin)/_components/content/status-view";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";
import { ProductEbookForm } from "./product-ebook-form";
import { ProductDetailsForm } from "./product-details-form";
import { ImageForm } from "./image-form";
import { ProductPricingForm } from "./product-pricing-form";
import { ProductSeoForm } from "./product-seo-form";
import {
  AffiliateMetadata,
  EbookMetadata,
  Gallery,
  WebinarMetadata,
} from "@/types";
import { ProductGalleryForm } from "./product-gallery-form";
import { ProductAffiliateForm } from "./affiliate/product-affiliate-form";
import { ProductWebinarForm } from "./product-webinar-form";
import { ProductFAQForm } from "./product-faq-form";

interface ProductFormProps {
  initialData: Product & {
    imageCover: Media | null;
    seo: Seo | null;
    gallery: Gallery[];
    faqs: {
      id: string;
      question: string;
      answer: string;
      sort: number;
    }[];
    metadata?: EbookMetadata | AffiliateMetadata | WebinarMetadata | null;
  };
  apiUrl: string;
  authors?: User[];
}

const productGalleryFormSchema = z.object({
  mediaId: z.string(),
  url: z.string().optional(),
  sort: z.coerce.number<number>(),
});

const productFAQsFormSchema = z.object({
  id: z.string().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  sort: z.coerce.number<number>(),
});

export const productFormSchema = z.object({
  title: z.string().min(1, {
    error: "Title is required!",
  }),
  categoryId: z.string().min(1, {
    error: "Category is required!",
  }),
  slug: z.string().min(1, {
    error: "Slug is required!",
  }),
  description: z.custom<Descendant[]>(),
  imageCoverId: z.string().optional(),
  price: z.coerce.number<number>(),
  discountedPrice: z.coerce.number<number>(), // Trasforma in numero,
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  gallery: z.array(productGalleryFormSchema),
  faqs: z.array(productFAQsFormSchema),
  metadata: z.any(),
});

const defaultSEO = {
  title: "",
  description: "",
};

export const ProductForm = ({
  initialData,
  apiUrl,
  authors,
}: ProductFormProps) => {
  const router = useRouter();

  const isEbookProduct = initialData.type === ProductType.EBOOK;
  const isAffiliateProduct = initialData.type === ProductType.AFFILIATE;
  const isWebinarProduct = initialData.type === ProductType.WEBINAR;

  const metadata = initialData.metadata;

  const form = useForm<z.infer<typeof productFormSchema>>({
    mode: "all",
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      ...initialData,
      description: initialData.description || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      categoryId: initialData.categoryId || undefined,
      imageCoverId: initialData.imageCoverId || undefined,
      price: initialData.price || 0,
      discountedPrice: initialData.discountedPrice || 0,
      gallery: [
        ...initialData.gallery.map((a) => ({
          mediaId: a.mediaId,
          sort: a.sort,
          url: a.media.url,
        })),
      ],
      faqs: [
        ...initialData.faqs.map((a) => ({
          question: a.question,
          answer: a.answer,
          sort: a.sort,
        })),
      ],
      seo: initialData.seo
        ? { ...initialData.seo, description: initialData.seo.description || "" }
        : { ...defaultSEO },
      metadata,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof productFormSchema>) => {
    if (initialData.status === ContentStatus.PUBLISHED) {
      try {
        await axios.post(`${apiUrl}/versions`, values);
        toast.success(`Item updated`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        router.refresh();
      }

      return;
    }

    try {
      await axios.patch(`${apiUrl}/versions/${initialData.id}`, values);
      toast.success(`Product updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const requiredFields = [initialData.title];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  if (!initialData || !initialData.rootId) {
    return redirect("/admin/products");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-6 max-w-5xl mx-auto h-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">Product setup</h1>
            <div className="flex items-center gap-x-2">
              <Button>Save</Button>
            </div>
          </div>
          <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pt-6 h-full">
            <div className="col-span-full md:col-span-4 lg:col-span-8">
              <div className="flex flex-col gap-y-4">
                <ProductDetailsForm
                  control={form.control}
                  initialData={initialData}
                  isSubmitting={isSubmitting}
                />

                {isEbookProduct && (
                  <ProductEbookForm
                    control={form.control}
                    authors={authors}
                    isSubmitting={isSubmitting}
                  />
                )}
                {isAffiliateProduct && (
                  <ProductAffiliateForm
                    control={form.control}
                    isSubmitting={isSubmitting}
                  />
                )}
                {isWebinarProduct && (
                  <ProductWebinarForm
                    control={form.control}
                    isSubmitting={isSubmitting}
                  />
                )}
                <ProductGalleryForm
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
                <ProductFAQForm
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
                <ProductSeoForm
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
            <div className="col-span-full md:col-span-2 lg:col-span-4 flex flex-col gap-y-4">
              <StatusView
                disabled={!isComplete}
                contentType={`${SeoContentTypeApi.Product}`}
                contentRootId={initialData.rootId!}
                contentId={initialData.id}
                status={initialData.status}
                lastSavedAt={initialData.updatedAt!}
              />
              <ImageForm
                imageCoverUrl={initialData.imageCover?.url}
                control={form.control}
                name="imageCoverId"
              />
              <ProductPricingForm
                control={form.control}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
