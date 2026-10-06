import * as z from "zod";

export const customerInsertSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  name: z.string().nullish(),
  phone: z.string().nullish(),
  notes: z.string().nullish(),
});

export type CustomerInsertValues = z.infer<typeof customerInsertSchema>;

export const customerUpdateSchema = customerInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type CustomerUpdateValues = z.infer<typeof customerUpdateSchema>;
