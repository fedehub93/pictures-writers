import "server-only";

import { TRPCError } from "@trpc/server";

import { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import { messagePreview } from "../lib/format";
import {
  ConversationSendError,
  sendConversationMessage,
} from "../lib/send-one-to-one";
import {
  conversationGetOneSchema,
  conversationListSchema,
  conversationSendSchema,
} from "../schemas";
import { assertAccountAccess } from "./access";

const listMessageSelect = {
  subject: true,
  bodyText: true,
  bodyHtml: true,
  direction: true,
  sentAt: true,
  createdAt: true,
  attachments: { select: { id: true } },
} satisfies Prisma.EmailMessageSelect;

export const conversationsRouter = createTRPCRouter({
  getMany: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationListSchema)
    .query(async ({ ctx, input }) => {
      await assertAccountAccess(ctx.auth.id, input.emailAccountId);

      const conversations = await db.conversation.findMany({
        where: {
          emailAccountId: input.emailAccountId,
          deletedAt: null,
        },
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: listMessageSelect,
          },
          _count: { select: { messages: true } },
        },
      });

      return conversations.map((conversation) => {
        const lastMessage = conversation.messages[0];

        return {
          id: conversation.id,
          contactEmail: conversation.contactEmail,
          contactName: conversation.contactName,
          hasUnread: conversation.hasUnread,
          updatedAt: conversation.updatedAt,
          messageCount: conversation._count.messages,
          lastMessage: lastMessage
            ? {
                subject: lastMessage.subject,
                snippet: messagePreview(lastMessage),
                direction: lastMessage.direction,
                sentAt: lastMessage.sentAt ?? lastMessage.createdAt,
                hasAttachments: lastMessage.attachments.length > 0,
              }
            : null,
        };
      });
    }),

  getOne: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationGetOneSchema)
    .query(async ({ ctx, input }) => {
      // Scope by account permission inside the query, so a thread the user
      // cannot access is indistinguishable from a missing one.
      const conversation = await db.conversation.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
          emailAccount: {
            userPermissions: { some: { userId: ctx.auth.id } },
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { attachments: { orderBy: { createdAt: "asc" } } },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      return conversation;
    }),

  sendReply: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationSendSchema)
    .mutation(async ({ ctx, input }) => {
      const conversation = await db.conversation.findFirst({
        where: { id: input.conversationId, deletedAt: null },
        select: { emailAccountId: true },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Sending is scoped by the same per-account permission as reading, so a
      // user who cannot see an inbox cannot send from it either.
      await assertAccountAccess(ctx.auth.id, conversation.emailAccountId);

      try {
        return await sendConversationMessage({
          conversationId: input.conversationId,
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          bodyText: input.bodyText,
          attachments: input.attachments?.map((attachment) => ({
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size,
            url: attachment.url,
          })),
        });
      } catch (error) {
        if (error instanceof ConversationSendError) {
          throw new TRPCError({
            code:
              error.code === "QUOTA_EXCEEDED"
                ? "TOO_MANY_REQUESTS"
                : error.code === "NOT_FOUND"
                  ? "NOT_FOUND"
                  : "BAD_REQUEST",
            message: error.message,
          });
        }
        throw error;
      }
    }),
});
