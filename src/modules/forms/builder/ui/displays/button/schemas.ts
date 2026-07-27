import z from "zod";

export const propertiesSchema = z.object({
  label: z.string().min(1),
});

export type PropertiesFormSchemaType = z.infer<typeof propertiesSchema>;
