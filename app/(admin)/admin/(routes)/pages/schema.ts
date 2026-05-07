import * as z from "zod";

export const pageInsertSchema = z.object({
  title: z.string().min(1, { error: "Title name is required" }),
  slug: z.string().min(1, { error: "Slug is required" }),
});

export const pageUpdateSchema = pageInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});
