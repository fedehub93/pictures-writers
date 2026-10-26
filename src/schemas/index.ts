import * as z from "zod/mini";

export const EmailSchema = z.pipe(
  z.string().check(z.minLength(1, "Please enter your email.")),
  z.email("The email address is badly formatted."),
);

export const SubscribeSchema = z.object({
  email: EmailSchema,
});

export const FreeDigitalDownloadSchema = z.looseObject({
  email: EmailSchema,
  rootId: z.string().check(z.minLength(1, "A product is required.")),
  privacyConsent: z.boolean().check(
    z.refine((value) => value === true, "You must accept the privacy policy."),
  ),
});

export const ContactSchema = z.object({
  name: z.string().check(z.minLength(1, "Name is required")),
  email: EmailSchema,
  subject: z.string().check(z.minLength(1, "Subject is required")),
  message: z.string().check(z.minLength(1, "Message is required")),
});
