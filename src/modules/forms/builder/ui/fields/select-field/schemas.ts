import z from "zod";

import type { SelectFieldProperties } from "../../../types/properties";

export const propertiesSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  label: z.string().min(1, { error: "Label is required" }),
  helperText: z
    .string()
    .max(200, { error: "Maximum characters reached (200)" }),
  placeholder: z.string(),
  options: z.array(z.string()),
  validation: z.object({
    required: z.boolean(),
  }),
});

export type PropertiesFormSchemaType = z.infer<typeof propertiesSchema>;

export const buildSchema = ({
  validation: { required },
}: SelectFieldProperties): z.ZodType => {
  let schema = z.string();

  if (required) {
    schema = schema.min(1, { error: "This field is required!" });
  }

  return schema;
};
