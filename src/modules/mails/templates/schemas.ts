import * as z from "zod";

export const templateInsertSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  description: z.string().optional().nullable(),
  designData: z.any().optional().nullable(),
  bodyHtml: z.string().optional().nullable(),
});

export type TemplateInsertValues = z.infer<typeof templateInsertSchema>;

export const templateUpdateSchema = templateInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type TemplateUpdateValues = z.infer<typeof templateUpdateSchema>;
