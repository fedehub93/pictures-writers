import * as z from "zod";

export const reviewsInsertSchema = z.object({
  reviewerName: z.string().min(1, { error: "Reviewer name is required" }),
  rating: z
    .number()
    .min(1)
    .max(5)
    .refine((val) => val % 0.5 === 0, {
      message: "Rating must be in increments of 0.5",
    }),
  comment: z.string().optional(),
  date: z.union([z.string(),z.date()]),
  productId: z.string().min(1, { error: "Product id is required" }),
});

export const reviewsUpdateSchema = reviewsInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});
