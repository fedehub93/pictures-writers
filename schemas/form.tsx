import { z } from "zod";

/**
 * Form
 */

export const formFormSchema = z.object({
  name: z.string().min(1, {
    error: "Name is required",
  }),
  fields: z.string().min(1, {
    error: "Name is required",
  }),
});

export type FormFormValues = z.infer<typeof formFormSchema>;
