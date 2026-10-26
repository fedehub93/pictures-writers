import * as z from "zod/mini";

import {
  type TextFieldProperties,
  TextInputEnum,
} from "../../../types/properties";

export const propertiesSchema = z.object({
  name: z.string().check(z.minLength(1, { error: "Name is required" })),
  label: z.string().check(z.minLength(1, { error: "Label is required" })),
  helperText: z
    .string()
    .check(z.maxLength(200, { error: "Maximum characters reached (200)" })),
  placeholder: z.string(),
  inputType: z.optional(z.enum(TextInputEnum)),
  validation: z.object({
    required: z.boolean(),
    minLength: z.optional(z.coerce.number<number>()),
    maxLength: z.optional(z.coerce.number<number>()),
  }),
});

export type PropertiesFormSchemaType = z.infer<typeof propertiesSchema>;

export const buildSchema = ({
  label,
  inputType,
  validation: { required, minLength, maxLength },
}: TextFieldProperties): z.ZodMiniType => {
  let schema: z.ZodMiniType =
    inputType === "email" ? z.email("Invalid email address") : z.string();

  if (required) {
    schema = schema.check(z.minLength(1, { error: `${label} is required!` }));
  }

  if (minLength) {
    schema = schema.check(
      z.minLength(minLength, {
        error: `Minimum characters for this field are ${minLength}`,
      }),
    );
  }

  if (maxLength) {
    schema = schema.check(
      z.maxLength(maxLength, {
        error: `Maximum characters for this field are ${maxLength}`,
      }),
    );
  }

  return schema;
};
