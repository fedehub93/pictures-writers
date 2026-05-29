import * as z from "zod";

const audiencesOptionSchema = z.object({
  id: z.string(),
});

const interactionsOptionSchema = z.object({
  id: z.string(),
  interactionType: z.string().optional(),
});

export const contactInsertSchema = z.object({
  email: z
    .email({ message: "Invalid email address" })
    .min(1, { error: "Email is required" }),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  audiences: z.array(audiencesOptionSchema),
  interactions: z.array(interactionsOptionSchema),
  isSubscriber: z.boolean(),
});

export type ContactInsertValues = z.infer<typeof contactInsertSchema>;

export const contactUpdateSchema = contactInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type ContactUpdateValues = z.infer<typeof contactUpdateSchema>;
