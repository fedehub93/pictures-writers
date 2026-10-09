import * as z from "zod";

export const productCategoryInsertSchema = z.object({
  title: z.string().min(1, { error: "Title is required" }),
  slug: z.string().min(1, { error: "Slug is required" }),
});

export type ProductCategoryInsertValues = z.infer<
  typeof productCategoryInsertSchema
>;

export const productCategoryUpdateSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
  title: z.string().min(1, { error: "Title is required" }).optional(),
  slug: z.string().min(1, { error: "Slug is required" }).optional(),
  description: z.string().nullable().optional(),
});

export type ProductCategoryUpdateValues = z.infer<
  typeof productCategoryUpdateSchema
>;

export const productCategoryUpdateSeoSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  ogTwitterTitle: z.string().nullable().optional(),
  ogTwitterDescription: z.string().nullable().optional(),
  noIndex: z.boolean(),
  noFollow: z.boolean(),
});

export type ProductCategoryUpdateSeoValues = z.infer<
  typeof productCategoryUpdateSeoSchema
>;
