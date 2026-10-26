import * as z from "zod/mini";

import type { UploadFieldProperties } from "../../../types/properties";

export const propertiesSchema = z.object({
  name: z.string().check(z.minLength(1, { error: "Name is required" })),
  label: z.string().check(z.minLength(1, { error: "Label is required" })),
  helperText: z
    .string()
    .check(z.maxLength(200, { error: "Maximum characters reached (200)" })),
  validation: z.object({
    required: z.boolean(),
  }),
});

export type PropertiesFormSchemaType = z.infer<typeof propertiesSchema>;

export const buildSchema = ({
  label,
  validation: { required },
}: UploadFieldProperties): z.ZodMiniType => {
  let schema: z.ZodMiniArray = z.array(z.any());

  if (required) {
    schema = schema.check(z.minLength(1, { error: `${label} is required!` }));
  }

  return schema;
};
