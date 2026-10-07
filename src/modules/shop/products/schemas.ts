import * as z from "zod";

import {
  ProductAcquisitionMode,
  ProductType,
} from "@/generated/prisma";

import { faqItemsSchema } from "@/modules/faq";

import { EbookType } from "./types";

/**
 * Product metadata is validated per product type via a discriminated union,
 * so a payload can never carry metadata that belongs to another type.
 */
export const ebookMetadataSchema = z.object({
  type: z.literal(ProductType.EBOOK),
  formats: z.array(
    z.object({
      type: z.enum(EbookType),
      url: z.string(),
      size: z.coerce.number<number>(),
      pages: z.coerce.number<number>(),
    }),
  ),
  edition: z.string(),
  publishedAt: z.coerce.date<Date>().nullable().optional(),
  author: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      imageUrl: z.string().nullish(),
    })
    .nullable()
    .optional(),
});

export const affiliateMetadataSchema = z.object({
  type: z.literal(ProductType.AFFILIATE),
  url: z.string(),
});

export const webinarMetadataSchema = z.object({
  type: z.literal(ProductType.WEBINAR),
  seats: z.coerce.number<number>(),
  platform: z.string(),
  lessons: z.array(
    z.object({
      title: z.string().optional(),
      date: z.union([z.string(), z.date()]),
      startTime: z.string(),
      endTime: z.string(),
    }),
  ),
  isOpen: z.boolean(),
});

export const serviceMetadataSchema = z.object({
  type: z.literal(ProductType.SERVICE),
  serviceType: z.string(),
  competitorPrice: z.coerce.number<number>(),
  target: z.string(),
  attachamentUrl: z.string(),
  features: z.array(
    z.object({
      title: z.string(),
      Icon: z.string(),
      description: z.string(),
    }),
  ),
});

export const productMetadataSchema = z.discriminatedUnion("type", [
  ebookMetadataSchema,
  affiliateMetadataSchema,
  webinarMetadataSchema,
  serviceMetadataSchema,
]);

export type ProductMetadataValues = z.infer<typeof productMetadataSchema>;

const productGallerySchema = z.object({
  mediaId: z.string().min(1),
  url: z.string().optional(),
  sort: z.coerce.number<number>(),
});

export const productInsertSchema = z.object({
  title: z.string().min(1, { error: "Title is required" }),
  slug: z.string().min(1, { error: "Slug is required" }),
  type: z.enum(ProductType),
});

export type ProductInsertValues = z.infer<typeof productInsertSchema>;

export const productUpdateSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
  rootId: z.string().min(1, { error: "Root Id is required" }),
  title: z.string().min(1, { error: "Title is required" }).optional(),
  slug: z.string().min(1, { error: "Slug is required" }).optional(),
  categoryId: z.string().nullable().optional(),
  tiptapDescription: z.any().optional(),
  imageCoverId: z.string().nullable().optional(),
  acquisitionMode: z.enum(ProductAcquisitionMode).optional(),
  formId: z.string().nullable().optional(),
  price: z.coerce.number<number>().optional(),
  discountedPrice: z.coerce.number<number>().optional(),
  isFree: z.boolean().optional(),
  metadata: productMetadataSchema.optional(),
  gallery: z.array(productGallerySchema).optional(),
  faqs: faqItemsSchema.optional(),
});

export type ProductUpdateValues = z.infer<typeof productUpdateSchema>;

export const productUpdateSeoSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
  rootId: z.string().min(1, { error: "Root Id is required" }),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  ogTwitterTitle: z.string().nullable().optional(),
  ogTwitterDescription: z.string().nullable().optional(),
  noIndex: z.boolean(),
  noFollow: z.boolean(),
});

export type ProductUpdateSeoValues = z.infer<typeof productUpdateSeoSchema>;
