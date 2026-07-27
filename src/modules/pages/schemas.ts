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
});

export type PageUpdateValues = z.infer<typeof pageUpdateSchema>;

export const pageUpdateContentSchema = pageInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
  rootId: z.string().min(1, { error: "Root Id is required" }),
  puckData: z.custom<Data<HydratedComponents>>(),
});

export type PageUpdateContentValues = z.infer<typeof pageUpdateContentSchema>;
