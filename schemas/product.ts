import { ProductAcquisitionMode } from "@/generated/prisma";
import { Descendant } from "slate";
import { z } from "zod";

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
  tiptapDescription: z.any().optional(),
  imageCoverId: z.string().optional(),
  acquisitionMode: z.enum(ProductAcquisitionMode),
  formId: z.string().optional(),
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

export type ProductFormValues = z.infer<typeof productFormSchema>;
