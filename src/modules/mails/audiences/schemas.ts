import * as z from "zod";

export const audienceInsertSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
});

export type AudienceInsertValues = z.infer<typeof audienceInsertSchema>;

export const audienceUpdateSchema = audienceInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type AudienceUpdateValues = z.infer<typeof audienceUpdateSchema>;
