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

export const conversationAttachmentSchema = z.object({
  filename: z.string().trim().min(1, { error: "A filename is required" }),
  contentType: z
    .string()
    .trim()
    .min(1, { error: "A content type is required" }),
  url: z.string().url({ error: "A valid attachment url is required" }),
  size: z.number().int().nonnegative().optional(),
});

export const conversationSendSchema = z.object({
  conversationId: z
    .string()
    .min(1, { error: "A conversation is required" }),
  subject: z.string().trim().min(1).max(998).optional(),
  bodyHtml: z
    .string()
    .trim()
    .min(1, { error: "A message body is required" }),
  bodyText: z.string().trim().optional(),
  attachments: z.array(conversationAttachmentSchema).max(10).optional(),
});
