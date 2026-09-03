import * as z from "zod";

import { EditorType } from "@/generated/prisma";

export const postInsertSchema = z.object({
  title: z.string().min(1, { error: "Title name is required" }),
  slug: z.string().min(1, { error: "Slug is required" }),
  scheduledAt: z.date().nullable().optional(),
});

export type PostInsertValues = z.infer<typeof postInsertSchema>;

export const postUpdateSchema = postInsertSchema.partial().extend({
  id: z.string().min(1, { error: "Id is required" }).optional(),
  rootId: z.string().min(1, { error: "Root Id is required" }).optional(),
  seoId: z
    .string()
    .min(1, { error: "SEO Id is required" })
    .nullable()
    .optional(),
  description: z.string().nullable().optional(),
  imageCoverId: z.string().nullable().optional(),
  editorType: z.enum([EditorType.SLATE, EditorType.TIPTAP]).optional(),
  bodyData: z.any().optional(),
  tiptapBodyData: z.any().optional(),
  categories: z
    .array(
      z.object({
        id: z.string().min(1),
        sort: z.coerce.number<number>(),
      }),
    )
    .optional(),
  tags: z
    .array(
      z.object({
        id: z.string().min(1),
      }),
    )
    .optional(),
  authors: z
    .array(
      z.object({
        id: z.string().min(1),
        sort: z.coerce.number<number>(),
      }),
    )
    .optional(),
});

export type PostUpdateValues = z.infer<typeof postUpdateSchema>;

export const postUpdateSeoSchema = z.object({
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

export type PostUpdateSeoValues = z.infer<typeof postUpdateSeoSchema>;
