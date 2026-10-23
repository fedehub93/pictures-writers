import * as z from "zod";

export const formInsertSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  gtmLabel: z.string().nullish().optional(),
  gtmCategory: z.string().nullish().optional(),
  gtmEventName: z.string().nullish().optional(),
  interactionType: z.string().nullish().optional(),
});

export type FormInsertValues = z.infer<typeof formInsertSchema>;

/** Empty input means "this form does not write an interaction". */
export const normalizeInteractionType = (
  value: string | null | undefined,
): string | null => value?.trim() || null;

export const formUpdateSchema = formInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type FormUpdateValues = z.infer<typeof formUpdateSchema>;
