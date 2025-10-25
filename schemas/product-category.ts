import * as z from "zod";

export const productCategoryFormSchema = z.object({
  title: z.string().min(1, {
    error: "Title is required!",
  }),
  slug: z.string().min(1, {
    error: "Slug is required!",
  }),
  description: z
    .string()
    .min(1, {
      error: "Descritpion is required!",
    })
    .nullable(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export type ProductCategoryFormValues = z.infer<
  typeof productCategoryFormSchema
>;
