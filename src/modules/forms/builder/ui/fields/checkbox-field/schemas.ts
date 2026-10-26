import * as z from "zod/mini";

import type { CheckboxFieldProperties } from "../../../types/properties";

export const propertiesSchema = z.object({
  name: z.string().check(z.minLength(1, { error: "Name is required" })),
  label: z.string().check(z.minLength(1, { error: "Label is required" })),
  helperText: z
    .string()
    .check(z.maxLength(200, { error: "Maximum characters reached (200)" })),
  description: z.optional(z.record(z.any(), z.any())),
  validation: z.object({
    required: z.boolean(),
  }),
});

export type PropertiesFormSchemaType = z.infer<typeof propertiesSchema>;

export const buildSchema = ({
  label,
  validation: { required },
}: CheckboxFieldProperties): z.ZodMiniType => {
  const schema = z._default(z.boolean(), false);

  if (required) {
    return schema.check(
      z.refine((value) => value === true, {
        error: `${label} is required!`,
      }),
    );
  }

  return schema;
};
