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

export const ContactSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  email: z
    .string()
    .min(1, {
      message: "Name is required",
    })
    .email("Email is invalid"),
  subject: z.string().min(1, {
    message: "Subject is required",
  }),
  message: z.string().min(1, { message: "Message is required" }),
});
