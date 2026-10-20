import "server-only";

import { TRPCError } from "@trpc/server";

import { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import { createUploadThingStorage } from "../lib/attachment-storage";
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
  conversationStarSchema,
  sentMessagesSchema,
  type ConversationView,
} from "../schemas";
import { assertAccountAccess } from "./access";

const messageAttachmentSelect = {
  select: { id: true, filename: true, contentType: true },
  orderBy: { createdAt: "asc" as const },
  take: 3,
} satisfies Pick<
  Prisma.EmailMessage$attachmentsArgs,
  "select" | "orderBy" | "take"
>;

const listMessageSelect = {
  subject: true,
  bodyText: true,
  bodyHtml: true,
  direction: true,
  sentAt: true,
  createdAt: true,
  attachments: messageAttachmentSelect,
} satisfies Prisma.EmailMessageSelect;

const sentMessageSelect = {
  id: true,
  conversationId: true,
  subject: true,
  bodyText: true,
  bodyHtml: true,
  toAddresses: true,
  sentAt: true,
  createdAt: true,
  attachments: messageAttachmentSelect,
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

/**
 * Load a trashed conversation with the requested fields. Deletion and restore
 * are only valid from Trash, and a conversation on an account the caller cannot
 * access is indistinguishable from a missing one.
 */
async function getTrashedConversation<T extends Prisma.ConversationSelect>(
  userId: string,
  id: string,
  select: T,
): Promise<Prisma.ConversationGetPayload<{ select: T }>> {
  const conversation = await db.conversation.findFirst({
    where: {
      id,
      deletedAt: { not: null },
      emailAccount: {
        userPermissions: { some: { userId } },
      },
    },
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

/**
 * Translate a mailbox view into a `where` clause. Views are queries over the
 * shared conversation, not containers. Starred includes archived threads but
 * never deleted ones; it is the caller's personal filter.
 */
function viewWhere(
  userId: string,
  view: ConversationView,
): Prisma.ConversationWhereInput {
  switch (view) {
    case "archived":
      return { deletedAt: null, archivedAt: { not: null } };
    case "starred":
      return {
        deletedAt: null,
        userStates: { some: { userId, starredAt: { not: null } } },
      };
    case "trash":
      return { deletedAt: { not: null } };
    case "inbox":
      return { deletedAt: null, archivedAt: null };
    default: {
      const exhaustive: never = view;
      throw new Error(`Unhandled conversation view: ${String(exhaustive)}`);
    }
  }
}

/** Whether the caller's personal state row marks the thread as starred. */
function isStarredFor(
  state: { starredAt: Date | null } | undefined,
): boolean {
  return state?.starredAt != null;
}

/** Derive the caller's unread flag from the read watermark. */
function isUnreadFor(
  lastInboundAt: Date | null,
  lastReadAt: Date | null,
): boolean {
  return (
    lastInboundAt !== null &&
    (lastReadAt === null || lastInboundAt.getTime() > lastReadAt.getTime())
  );
}

/**
 * Write the caller's read watermark for a conversation, creating the personal
 * state row lazily. `null` clears the watermark so all inbound mail is unread
 * again.
 */
async function setConversationReadState(
  userId: string,
  conversationId: string,
  lastReadAt: Date | null,
) {
  return db.conversationUserState.upsert({
    where: {
      userId_conversationId: { userId, conversationId },
    },
    create: { userId, conversationId, lastReadAt },
    update: { lastReadAt },
    select: { conversationId: true, lastReadAt: true },
  });
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

      const view = input.view ?? "inbox";
      const conversations = await db.conversation.findMany({
        where: {
          emailAccountId: input.emailAccountId,
          ...viewWhere(ctx.auth.id, view),
        },
        // Trash is a deletion log, so it is ordered by when each thread was
        // trashed rather than by its last message.
        orderBy:
          view === "trash"
            ? [{ deletedAt: { sort: "desc", nulls: "last" } }]
            : [{ lastMessageAt: { sort: "desc", nulls: "last" } }],
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: listMessageSelect,
          },
          userStates: {
            where: { userId: ctx.auth.id },
            take: 1,
            select: { lastReadAt: true, starredAt: true },
          },
          _count: { select: { messages: true } },
        },
      });

      return conversations.map((conversation) => {
        const lastMessage = conversation.messages[0];
        const state = conversation.userStates[0];

        return {
          id: conversation.id,
          contactEmail: conversation.contactEmail,
          contactName: conversation.contactName,
          isUnread: isUnreadFor(
            conversation.lastInboundAt,
            state?.lastReadAt ?? null,
          ),
          isStarred: isStarredFor(state),
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

  /** Outbound messages for one account, newest send first. */
  getSentMessages: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(sentMessagesSchema)
    .query(async ({ ctx, input }) => {
      await assertAccountAccess(ctx.auth.id, input.emailAccountId);

      const messages = await db.emailMessage.findMany({
        where: {
          direction: "OUTBOUND",
          // A trashed conversation no longer has a reachable thread, so its
          // sent messages leave the Sent view with it.
          conversation: {
            emailAccountId: input.emailAccountId,
            deletedAt: null,
          },
        },
        orderBy: [{ createdAt: "desc" }],
        select: sentMessageSelect,
      });

      return messages.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        subject: message.subject,
        recipients: message.toAddresses,
        snippet: messagePreview(message),
        sentAt: message.sentAt ?? message.createdAt,
        attachments: message.attachments,
      }));
    }),

  /**
   * Unread and archived totals for every account the caller may access.
   * Unread is derived in SQL because Prisma cannot compare `Conversation` and
   * `ConversationUserState` columns across a relation; a missing state row
   * counts as never read.
   */
  getCounts: permissionProcedure(PERMISSIONS.MAIL_READ).query(async ({ ctx }) => {
    const accounts = await db.$queryRaw<
      { emailAccountId: string; unread: number; archived: number }[]
    >(Prisma.sql`
      SELECT
        permission."emailAccountId" AS "emailAccountId",
        COUNT(conversation."id") FILTER (
          WHERE conversation."deletedAt" IS NULL
            AND conversation."archivedAt" IS NULL
            AND conversation."lastInboundAt" IS NOT NULL
            AND (
              state."lastReadAt" IS NULL
              OR conversation."lastInboundAt" > state."lastReadAt"
            )
        )::int AS "unread",
        COUNT(conversation."id") FILTER (
          WHERE conversation."deletedAt" IS NULL
            AND conversation."archivedAt" IS NOT NULL
        )::int AS "archived"
      FROM "EmailAccountUserPermission" AS permission
      LEFT JOIN "Conversation" AS conversation
        ON conversation."emailAccountId" = permission."emailAccountId"
      LEFT JOIN "ConversationUserState" AS state
        ON state."conversationId" = conversation."id"
        AND state."userId" = permission."userId"
      WHERE permission."userId" = ${ctx.auth.id}
      GROUP BY permission."emailAccountId"
      ORDER BY permission."emailAccountId"
    `);

    return {
      totalUnread: accounts.reduce((total, account) => total + account.unread, 0),
      accounts,
    };
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
          userStates: {
            where: { userId: ctx.auth.id },
            take: 1,
            select: { lastReadAt: true, starredAt: true },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const { userStates, ...conversationWithoutState } = conversation;
      const state = userStates[0];

      return {
        ...conversationWithoutState,
        isUnread: isUnreadFor(
          conversation.lastInboundAt,
          state?.lastReadAt ?? null,
        ),
        isStarred: isStarredFor(state),
      };
    }),

  /** Move the caller's read watermark to now, clearing the unread state. */
  markRead: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationIdSchema)
    .mutation(async ({ ctx, input }) => {
      const { emailAccountId } = await getActiveConversation(input.id, {
        emailAccountId: true,
      });
      await assertAccountAccess(ctx.auth.id, emailAccountId);

      const state = await setConversationReadState(
        ctx.auth.id,
        input.id,
        new Date(),
      );

      return { id: state.conversationId, lastReadAt: state.lastReadAt };
    }),

  /**
   * Clear the caller's read watermark so every inbound message becomes unread
   * again. A missing state row is created, preserving the same semantics.
   */
  markUnread: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationIdSchema)
    .mutation(async ({ ctx, input }) => {
      const { emailAccountId } = await getActiveConversation(input.id, {
        emailAccountId: true,
      });
      await assertAccountAccess(ctx.auth.id, emailAccountId);

      const state = await setConversationReadState(ctx.auth.id, input.id, null);

      return { id: state.conversationId, lastReadAt: state.lastReadAt };
    }),

  /**
   * Star or unstar a conversation for the caller. Only the personal state row
   * changes, so the shared conversation and its inbox ordering are untouched.
   */
  setStarred: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationStarSchema)
    .mutation(async ({ ctx, input }) => {
      const { emailAccountId } = await getActiveConversation(input.id, {
        emailAccountId: true,
      });
      await assertAccountAccess(ctx.auth.id, emailAccountId);

      const starredAt = input.starred ? new Date() : null;
      const state = await db.conversationUserState.upsert({
        where: {
          userId_conversationId: {
            userId: ctx.auth.id,
            conversationId: input.id,
          },
        },
        create: {
          userId: ctx.auth.id,
          conversationId: input.id,
          starredAt,
        },
        update: { starredAt },
        select: { conversationId: true, starredAt: true },
      });

      return { id: state.conversationId, starredAt: state.starredAt };
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

      let result;
      try {
        result = await sendConversationMessage({
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

      // Replying is an explicit acknowledgement: keep the conversation read
      // even when it was opened while the window was hidden.
      await setConversationReadState(
        ctx.auth.id,
        input.conversationId,
        new Date(),
      );

      return result;
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

  /** Soft-delete a conversation into Trash. */
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
   * Restore a trashed conversation. `archivedAt` is untouched, so an archived
   * thread returns to Archive and every other thread returns to the Inbox.
   */
  restore: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationIdSchema)
    .mutation(async ({ ctx, input }) => {
      await getTrashedConversation(ctx.auth.id, input.id, { id: true });

      return db.conversation.update({
        where: { id: input.id },
        data: { deletedAt: null },
        select: { id: true },
      });
    }),

  /**
   * Permanently delete a trashed conversation. The delete re-checks the Trash
   * state so a conversation restored concurrently is not destroyed, and stored
   * attachment files are removed best-effort afterwards: a storage failure must
   * not keep the rows alive.
   */
  deleteForever: permissionProcedure(PERMISSIONS.MAIL_READ)
    .input(conversationIdSchema)
    .mutation(async ({ ctx, input }) => {
      const conversation = await getTrashedConversation(ctx.auth.id, input.id, {
        id: true,
        messages: {
          select: { attachments: { select: { url: true } } },
        },
      });

      const attachmentUrls = conversation.messages.flatMap((message) =>
        message.attachments.map((attachment) => attachment.url),
      );

      const deleted = await db.conversation.deleteMany({
        where: {
          id: input.id,
          deletedAt: { not: null },
          emailAccount: {
            userPermissions: { some: { userId: ctx.auth.id } },
          },
        },
      });

      if (deleted.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      if (attachmentUrls.length > 0) {
        try {
          await createUploadThingStorage().delete(attachmentUrls);
        } catch (error) {
          console.error(
            "[CONVERSATIONS] attachment cleanup failed",
            { conversationId: input.id },
            error,
          );
        }
      }

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
