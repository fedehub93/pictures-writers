import * as z from "zod";

export const conversationListSchema = z.object({
  emailAccountId: z
    .string()
    .min(1, { error: "An email account is required" }),
});

export type ConversationListInput = z.infer<typeof conversationListSchema>;

export const conversationGetOneSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
});

export type ConversationGetOneInput = z.infer<
  typeof conversationGetOneSchema
>;
