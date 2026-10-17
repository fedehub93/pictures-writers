import * as z from "zod";

const emailAccountFieldsSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required" }).max(120),
  email: z
    .email({ error: "A valid email address is required" })
    .transform((email) => email.toLowerCase()),
  displayName: z.string().trim().max(120).nullable().optional(),
  signature: z.string().max(5000).nullable().optional(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
});

export const emailAccountInsertSchema = emailAccountFieldsSchema.extend({
  userIds: z.array(z.string()),
});

export type EmailAccountInsertValues = z.infer<typeof emailAccountInsertSchema>;

export const emailAccountUpdateSchema = emailAccountFieldsSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type EmailAccountUpdateValues = z.infer<typeof emailAccountUpdateSchema>;

export const emailAccountIdSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
});

export const emailAccountSetDefaultSchema = emailAccountIdSchema;

export const emailAccountSetActiveSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
  isActive: z.boolean(),
});

export const emailAccountSetUserPermissionsSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
  userIds: z.array(z.string()),
});

export const emailAccountRemoveSchema = emailAccountIdSchema;
