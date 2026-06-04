import * as z from "zod";
import { EmailProvider } from "@/generated/prisma";

export const settingsInsertSchema = z.object({
  emailSenderName: z.string().optional(),
  emailSender: z
    .email()
    .min(1, {
      error: "Email sender required",
    })
    .optional(),
  emailResponse: z
    .email()
    .min(1, {
      error: "Email receiver required",
    })
    .optional(),

  emailProvider: z.custom<EmailProvider>().optional(),
  emailApiKey: z.string().optional(),
  maxEmailsPerDay: z.coerce.number<number>().int().optional(),
  subscriptionTemplateId: z.string().nullable().optional(),
  freeEbookTemplateId: z.string().nullable().optional(),
  webinarTemplateId: z.string().nullable().optional(),
});

export type SettingsInsertValues = z.infer<typeof settingsInsertSchema>;

export const settingsUpdateSchema = settingsInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type SettingsUpdateValues = z.infer<typeof settingsUpdateSchema>;

export const settingsTesterSchema = z.object({
  emailRecipient: z
    .email({ error: "This is not a valid email." })
    .min(1, { message: "Email recipient is required" }),
  emailTemplateId: z.string().optional(),
});

export type SettingsTesterValues = z.infer<typeof settingsTesterSchema>;
