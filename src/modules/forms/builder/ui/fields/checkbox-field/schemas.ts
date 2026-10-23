import z from "zod";

import type { CheckboxFieldProperties } from "../../../types/properties";

export const propertiesSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  label: z.string().min(1, { error: "Label is required" }),
  helperText: z
    .string()
    .max(200, { error: "Maximum characters reached (200)" }),
  description: z.record(z.any(), z.any()).optional(),
  validation: z.object({
    required: z.boolean(),
  }),
});

export type PropertiesFormSchemaType = z.infer<typeof propertiesSchema>;

export const buildSchema = ({
  label,
  validation: { required },
}: CheckboxFieldProperties): z.ZodType => {
  const schema = z.boolean().default(false);

  if (required) {
    return schema.refine((value) => value === true, {
      error: `${label} is required!`,
    });
  }

  return schema;
};
