import * as z from "zod";
import { HydratedComponents } from "@/puck/config";
import { Data } from "@puckeditor/core";

export const pageInsertSchema = z.object({
  title: z.string().min(1, { error: "Title name is required" }),
  slug: z.string().min(1, { error: "Slug is required" }),
});

export type PageInsertValues = z.infer<typeof pageInsertSchema>;

export const pageUpdateSchema = pageInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
  rootId: z.string().min(1, { error: "Root Id is required" }),
  puckData: z.custom<Data<HydratedComponents>>().nullable().optional(),
  seoId: z
    .string()
    .min(1, { error: "SEO Id is required" })
    .nullable()
    .optional(),
});

export type PageUpdateValues = z.infer<typeof pageUpdateSchema>;

export const pageUpdateSeoSchema = z.object({
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

export type PageUpdateSeoValues = z.infer<typeof pageUpdateSeoSchema>;
