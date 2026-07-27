import z from "zod";

export const propertiesSchema = z.object({
  label: z.string().min(1, { error: "Label is required" }),
  columns: z.coerce.number<number>().optional(),
  gap: z.coerce.number<number>().optional(),
});

export type PropertiesFormSchemaType = z.infer<typeof propertiesSchema>;
