import * as z from "zod";

export const formInsertSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  gtmLabel: z.string().optional(),
  gtmCategory: z.string().optional(),
  gtmEventName: z.string().optional(),
});

export type FormInsertValues = z.infer<typeof formInsertSchema>;

export const formUpdateSchema = formInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type FormUpdateValues = z.infer<typeof formUpdateSchema>;
