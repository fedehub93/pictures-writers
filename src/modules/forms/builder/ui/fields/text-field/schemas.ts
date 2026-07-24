import z from "zod";

import {
  type TextFieldProperties,
  TextInputEnum,
} from "../../../types/properties";

export const propertiesSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  label: z.string().min(1, { error: "Label is required" }),
  helperText: z
    .string()
    .max(200, { error: "Maximum characters reached (200)" }),
  placeholder: z.string(),
  inputType: z.enum(TextInputEnum).optional(),
  validation: z.object({
    required: z.boolean(),
    minLength: z.coerce.number<number>().optional(),
    maxLength: z.coerce.number<number>().optional(),
  }),
});

export type PropertiesFormSchemaType = z.infer<typeof propertiesSchema>;

export const buildSchema = ({
  label,
  inputType,
  validation: { required, minLength, maxLength },
}: TextFieldProperties): z.ZodType => {
  let schema = inputType === "email" ? z.email() : z.string();

  if (required) {
    schema = schema.min(1, { error: `${label} is required!` });
  }

  if (minLength) {
    schema = schema.min(minLength, {
      error: `Minimum characters for this field are ${minLength}`,
    });
  }

  if (maxLength) {
    schema = schema.max(maxLength, {
      error: `Maximum characters for this field are ${maxLength}`,
    });
  }

  return schema;
};
