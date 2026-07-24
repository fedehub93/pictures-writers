import z from "zod";

export const propertiesSchema = z.object({
  label: z.string().min(1),
  content: z.record(z.any(), z.any()),
});

export type PropertiesFormSchemaType = z.infer<typeof propertiesSchema>;
