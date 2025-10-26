import { z } from "zod";

/**
 * Form
 */

export const formFormSchema = z.object({
  name: z.string().min(1, {
    error: "Name is required",
  }),
  fields: z.string().optional(),
});

export type FormFormValues = z.infer<typeof formFormSchema>;
