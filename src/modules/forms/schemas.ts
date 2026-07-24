import * as z from "zod";

export const formInsertSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  gtmLabel: z.string().nullish().optional(),
  gtmCategory: z.string().nullish().optional(),
  gtmEventName: z.string().nullish().optional(),
});

export type FormInsertValues = z.infer<typeof formInsertSchema>;

export const formUpdateSchema = formInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type FormUpdateValues = z.infer<typeof formUpdateSchema>;
