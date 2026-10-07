import * as z from "zod";

export const reviewInsertSchema = z.object({
  reviewerName: z.string().min(1, { error: "Reviewer name is required" }),
  role: z.string().min(1, { error: "Role is required" }),
  rating: z
    .number()
    .min(1)
    .max(5)
    .refine((value) => value % 0.5 === 0, {
      error: "Rating must be in increments of 0.5",
    }),
  comment: z.string().optional(),
  date: z.date(),
  productId: z.string().min(1, { error: "Product id is required" }),
  verifiedPurchase: z.boolean(),
});

export type ReviewInsertValues = z.infer<typeof reviewInsertSchema>;

export const reviewUpdateSchema = reviewInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type ReviewUpdateValues = z.infer<typeof reviewUpdateSchema>;
