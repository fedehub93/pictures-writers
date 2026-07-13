import z from "zod";

export const propertiesSchema = z.object({
  label: z.string().min(1, { error: "Label is required" }),
  helperText: z
    .string()
    .max(200, { error: "Maximum characters reached (200)" }),
  placeholder: z.string(),
});

export type PropertiesFormSchemaType = z.infer<typeof propertiesSchema>;
