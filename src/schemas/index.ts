import { z } from "zod";

export const EmailSchema = z
  .string()
  .min(1, "Please enter your email.")
  .pipe(z.email("The email address is badly formatted."));

export const SubscribeSchema = z.object({
  email: EmailSchema,
});

export const FreeDigitalDownloadSchema = z.looseObject({
  email: EmailSchema,
  rootId: z.string().min(1, "A product is required."),
  privacyConsent: z
    .boolean()
    .refine((value) => value === true, "You must accept the privacy policy."),
});

export const ContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: EmailSchema,
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});
