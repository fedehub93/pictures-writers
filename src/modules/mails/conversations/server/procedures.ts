import "server-only";

import { TRPCError } from "@trpc/server";

import { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import { messagePreview, splitName } from "../lib/format";
import {
  NewMessageError,
  sendNewMessage,
  type NewMessageErrorCode,
} from "../lib/send-new-message";
import {
  ConversationSendError,
  sendConversationMessage,
  type ConversationSendErrorCode,
} from "../lib/send-one-to-one";
import {
  conversationArchiveSchema,
  conversationGetOneSchema,
  conversationIdSchema,
  conversationListSchema,
  conversationNewMessageSchema,
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
  attachments: {
    select: { id: true, filename: true, contentType: true },
    orderBy: { createdAt: "asc" as const },
    take: 3,
  },
} satisfies Prisma.EmailMessageSelect;

/**
 * Load a non-deleted conversation with the requested fields, or fail with
 * `NOT_FOUND`. Callers then scope access with `assertAccountAccess`.
 */
async function getActiveConversation<T extends Prisma.ConversationSelect>(
  id: string,
  select: T,
): Promise<Prisma.ConversationGetPayload<{ select: T }>> {
  const conversation = await db.conversation.findFirst({
    where: { id, deletedAt: null },
    select,
  });

  if (!conversation) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Conversation not found",
    });
  }

  return conversation;
}

/** Map a use-case send error code onto the closest tRPC code. */
function trpcCodeForSendError(
  code: ConversationSendErrorCode | NewMessageErrorCode,
): TRPCError["code"] {
  switch (code) {
    case "QUOTA_EXCEEDED":
      return "TOO_MANY_REQUESTS";
    case "NOT_FOUND":
    case "ACCOUNT_NOT_FOUND":
      return "NOT_FOUND";
    default:
      return "BAD_REQUEST";
  }
}

/** Normalize attachment input for the send use-cases. */
function toOutboundAttachments(
  attachments:
    | { filename: string; contentType: string; url: string; size?: number }[]
    | undefined,
) {
  return attachments?.map((attachment) => ({
    filename: attachment.filename,
    contentType: attachment.contentType,
    size: attachment.size,
    url: attachment.url,
  }));
}

export const conversationsRouter = createTRPCRouter({
  getMany: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationListSchema)
    .query(async ({ ctx, input }) => {
      await assertAccountAccess(ctx.auth.id, input.emailAccountId);

      const conversations = await db.conversation.findMany({
        where: {
          emailAccountId: input.emailAccountId,
          deletedAt: null,
          // Archived conversations are hidden from the main inbox and surfaced
          // only in the archived view.
          archivedAt: input.archived ? { not: null } : null,
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
                attachments: lastMessage.attachments,
              }
            : null,
        };
      });
    }),

  getOne: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationGetOneSchema)
    .query(async ({ ctx, input }) => {
      // Scope by account permission inside the query, so a conversation the
      // user cannot access is indistinguishable from a missing one.
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
      const { emailAccountId } = await getActiveConversation(
        input.conversationId,
        { emailAccountId: true },
      );

      // Sending is scoped by the same per-account permission as reading, so a
      // user who cannot see an inbox cannot send from it either.
      await assertAccountAccess(ctx.auth.id, emailAccountId);

      try {
        return await sendConversationMessage({
          conversationId: input.conversationId,
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          bodyText: input.bodyText,
          attachments: toOutboundAttachments(input.attachments),
        });
      } catch (error) {
        if (error instanceof ConversationSendError) {
          throw new TRPCError({
            code: trpcCodeForSendError(error.code),
            message: error.message,
          });
        }
        throw error;
      }
    }),

  /**
   * Start (or continue) a one-to-one conversation with an arbitrary address.
   * The provider is only invoked once the user has access to the account and
   * the transactional quota allows it.
   */
  sendNew: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationNewMessageSchema)
    .mutation(async ({ ctx, input }) => {
      await assertAccountAccess(ctx.auth.id, input.emailAccountId);

      try {
        return await sendNewMessage({
          emailAccountId: input.emailAccountId,
          to: input.to,
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          bodyText: input.bodyText,
          attachments: toOutboundAttachments(input.attachments),
        });
      } catch (error) {
        if (error instanceof NewMessageError) {
          throw new TRPCError({
            code: trpcCodeForSendError(error.code),
            message: error.message,
          });
        }
        throw error;
      }
    }),

  /** Archive or unarchive a conversation by toggling its `archivedAt`. */
  setArchived: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationArchiveSchema)
    .mutation(async ({ ctx, input }) => {
      const { emailAccountId } = await getActiveConversation(input.id, {
        emailAccountId: true,
      });
      await assertAccountAccess(ctx.auth.id, emailAccountId);

      return db.conversation.update({
        where: { id: input.id },
        data: { archivedAt: input.archived ? new Date() : null },
        select: { id: true, archivedAt: true },
      });
    }),

  /** Soft-delete a conversation; a future trash view can surface `deletedAt`. */
  remove: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationIdSchema)
    .mutation(async ({ ctx, input }) => {
      const { emailAccountId } = await getActiveConversation(input.id, {
        emailAccountId: true,
      });
      await assertAccountAccess(ctx.auth.id, emailAccountId);

      await db.conversation.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { id: input.id };
    }),

  /**
   * Create an `EmailContact` from the conversation's sender details and link
   * it. Never creates the contact automatically on inbound — this is an
   * explicit, one-click action.
   */
  createContact: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationIdSchema)
    .mutation(async ({ ctx, input }) => {
      const conversation = await getActiveConversation(input.id, {
        id: true,
        emailAccountId: true,
        contactEmail: true,
        contactName: true,
        contactId: true,
      });

      await assertAccountAccess(ctx.auth.id, conversation.emailAccountId);

      if (conversation.contactId) {
        return db.emailContact.findUniqueOrThrow({
          where: { id: conversation.contactId },
        });
      }

      const { firstName, lastName } = splitName(conversation.contactName);

      const existing = await db.emailContact.findFirst({
        where: {
          email: { equals: conversation.contactEmail, mode: "insensitive" },
        },
      });

      const contact =
        existing ??
        (await db.emailContact.create({
          data: {
            email: conversation.contactEmail,
            firstName,
            lastName,
            // A correspondent is not a marketing subscriber unless they opt in.
            isSubscriber: false,
          },
        }));

      await db.conversation.update({
        where: { id: conversation.id },
        data: { contactId: contact.id },
      });

      return contact;
    }),
});
