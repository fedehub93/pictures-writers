import * as v from "valibot";

import { EbookType } from "@/modules/shop/products/types";

export const EmailSchemaValibot = v.pipe(
  v.string(),
  v.nonEmpty("Please enter your email."),
  v.email("The email address is badly formatted."),
);

export const SubscribeSchemaValibot = v.object({
  email: EmailSchemaValibot,
});

export const FreeEbookSchemaValibot = v.object({
  email: EmailSchemaValibot,
  rootId: v.string(),
  format: v.enum(EbookType),
});

export const FreeDigitalDownloadSchemaValibot = v.object({
  email: EmailSchemaValibot,
  rootId: v.pipe(v.string(), v.nonEmpty("A product is required.")),
  privacyConsent: v.pipe(
    v.boolean(),
    v.value(true, "You must accept the privacy policy."),
  ),
});

export const ContactSchemaValibot = v.object({
  name: v.pipe(v.string(), v.nonEmpty("Name is required")),
  email: EmailSchemaValibot,
  subject: v.pipe(v.string(), v.nonEmpty("Subject is required")),
  message: v.pipe(v.string(), v.nonEmpty("Message is required")),
});
