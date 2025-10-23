import { z } from "zod";

export const projectFormSchema = z.object({
  title: z.string().min(1, {
    error: "Name is required!",
  }),
  logline: z.string().min(1, {
    error: "Logline is required!",
  }),
  file: z.object({
    key: z.string().min(1, {
      error: "File is required!",
    }),
    name: z.string().min(1, {
      error: "File is required!",
    }),
    url: z.string().min(1, {
      error: "File is required!",
    }),
    size: z.number(),
    type: z.string().min(1, {
      error: "File type is required!",
    }),
  }),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
