import * as z from "zod";

export const categoryInsertSchema = z.object({
  title: z.string().min(1, { error: "Title name is required" }),
  slug: z.string().min(1, { error: "Slug is required" }),
});

export type CategoryInsertValues = z.infer<typeof categoryInsertSchema>;

export const categoryUpdateSchema = categoryInsertSchema.partial().extend({
  id: z.string().min(1, { error: "Id is required" }),
  rootId: z.string().min(1, { error: "Root Id is required" }),
  seoId: z
    .string()
    .min(1, { error: "SEO Id is required" })
    .nullable()
    .optional(),
    description:z.string().nullable().optional()
});

export type CategoryUpdateValues = z.infer<typeof categoryUpdateSchema>;

export const categoryUpdateSeoSchema = z.object({
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

export type CategoryUpdateSeoValues = z.infer<typeof categoryUpdateSeoSchema>;
