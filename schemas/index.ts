import * as z from "zod";

export const SubscribeSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const FreeEbookSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  ebookId: z.string().optional(),
});
