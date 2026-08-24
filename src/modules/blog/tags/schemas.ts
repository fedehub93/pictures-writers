import * as z from "zod";

export const tagInsertSchema = z.object({
  title: z.string().min(1, { error: "Title name is required" }),
  slug: z.string().min(1, { error: "Slug is required" }),
});

export type TagInsertValues = z.infer<typeof tagInsertSchema>;

export const tagUpdateSchema = tagInsertSchema.partial().extend({
  id: z.string().min(1, { error: "Id is required" }),
  rootId: z.string().min(1, { error: "Root Id is required" }),
  seoId: z
    .string()
    .min(1, { error: "SEO Id is required" })
    .nullable()
    .optional(),
  description: z.string().nullable().optional(),
});

export type TagUpdateValues = z.infer<typeof tagUpdateSchema>;

export const tagUpdateSeoSchema = z.object({
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

export type TagUpdateSeoValues = z.infer<typeof tagUpdateSeoSchema>;
