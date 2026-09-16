import * as v from "valibot";

import { EbookType } from "@/types";

export const SubscribeSchemaValibot = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your email."),
    v.email("The email address is badly formatted."),
  ),
});

export const FreeEbookSchemaValibot = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your email."),
    v.email("The email address is badly formatted."),
  ),
  rootId: v.string(),
  format: v.enum(EbookType),
});

export const ContactSchemaValibot = v.object({
  name: v.pipe(v.string(), v.nonEmpty("Name is required")),
  email: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your email."),
    v.email("The email address is badly formatted."),
  ),
  subject: v.pipe(v.string(), v.nonEmpty("Subject is required")),
  message: v.pipe(v.string(), v.nonEmpty("Message is required")),
});
