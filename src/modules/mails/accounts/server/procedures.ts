import "server-only";

import { TRPCError } from "@trpc/server";

import { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import {
  emailAccountIdSchema,
  emailAccountInsertSchema,
  emailAccountSetActiveSchema,
  emailAccountSetDefaultSchema,
  emailAccountSetUserPermissionsSchema,
  emailAccountUpdateSchema,
} from "../schemas";

type DbClient = typeof db | Prisma.TransactionClient;

const userSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  imageUrl: true,
} satisfies Prisma.UserSelect;

const accountInclude = {
  userPermissions: {
    select: {
      id: true,
      userId: true,
      user: { select: userSelect },
    },
    orderBy: { createdAt: "asc" as const },
  },
  _count: { select: { conversations: true } },
} satisfies Prisma.EmailAccountInclude;

const accountOrderBy = [
  { isDefault: "desc" as const },
  { name: "asc" as const },
];

/** Normalize the optional string fields, storing empty values as `null`. */
function toAccountData(fields: {
  name: string;
  email: string;
  displayName?: string | null;
  signature?: string | null;
  isActive: boolean;
  isDefault: boolean;
}) {
  return {
    name: fields.name,
    email: fields.email,
    displayName: fields.displayName?.trim() || null,
    signature: fields.signature?.trim() || null,
    isActive: fields.isActive,
    isDefault: fields.isDefault,
  };
}

/** Clear the `isDefault` flag on every account except the given one. */
async function clearOtherDefaults(client: DbClient, keepId?: string) {
  await client.emailAccount.updateMany({
    where: {
      isDefault: true,
      ...(keepId ? { id: { not: keepId } } : {}),
    },
    data: { isDefault: false },
  });
}

async function getAccountOrThrow(
  client: DbClient,
  id: string,
): Promise<{ id: string }> {
  const account = await client.emailAccount.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!account) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Email account not found",
    });
  }

  return account;
}

function translateUniqueViolation(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "An account with this email already exists",
    });
  }
  throw error;
}

export const emailAccountsRouter = createTRPCRouter({
  getMany: permissionProcedure(PERMISSIONS.EMAIL_ACCOUNTS_READ).query(
    async () => {
      return db.emailAccount.findMany({
        include: accountInclude,
        orderBy: accountOrderBy,
      });
    },
  ),

  getOne: permissionProcedure(PERMISSIONS.EMAIL_ACCOUNTS_READ)
    .input(emailAccountIdSchema)
    .query(async ({ input }) => {
      const account = await db.emailAccount.findUnique({
        where: { id: input.id },
        include: accountInclude,
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email account not found",
        });
      }

      return account;
    }),

  /**
   * Accounts the current user is allowed to use, used by the Conversations
   * account selector. A user with no `EmailAccountUserPermission` sees nothing.
   */
  getAllowed: permissionProcedure(PERMISSIONS.MAIL_READ).query(
    async ({ ctx }) => {
      const permissions = await db.emailAccountUserPermission.findMany({
        where: {
          userId: ctx.auth.id,
          emailAccount: { isActive: true },
        },
        select: { emailAccountId: true },
      });

      if (permissions.length === 0) {
        return [];
      }

      return db.emailAccount.findMany({
        where: {
          id: { in: permissions.map((p) => p.emailAccountId) },
          isActive: true,
        },
        orderBy: accountOrderBy,
      });
    },
  ),

  getAssignableUsers: permissionProcedure(
    PERMISSIONS.EMAIL_ACCOUNTS_READ,
  ).query(async () => {
    return db.user.findMany({
      where: { accountStatus: "ACTIVE" },
      select: userSelect,
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });
  }),

  create: permissionProcedure(PERMISSIONS.EMAIL_ACCOUNTS_MANAGE)
    .input(emailAccountInsertSchema)
    .mutation(async ({ input }) => {
      const { userIds, ...fields } = input;

      try {
        return await db.$transaction(async (transaction) => {
          const account = await transaction.emailAccount.create({
            data: toAccountData(fields),
          });

          if (account.isDefault) {
            await clearOtherDefaults(transaction, account.id);
          }

          if (userIds.length > 0) {
            await transaction.emailAccountUserPermission.createMany({
              data: userIds.map((userId) => ({
                userId,
                emailAccountId: account.id,
              })),
              skipDuplicates: true,
            });
          }

          return transaction.emailAccount.findUniqueOrThrow({
            where: { id: account.id },
            include: accountInclude,
          });
        });
      } catch (error) {
        translateUniqueViolation(error);
      }
    }),

  update: permissionProcedure(PERMISSIONS.EMAIL_ACCOUNTS_MANAGE)
    .input(emailAccountUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...fields } = input;

      try {
        return await db.$transaction(async (transaction) => {
          await getAccountOrThrow(transaction, id);

          const account = await transaction.emailAccount.update({
            where: { id },
            data: toAccountData(fields),
          });

          if (account.isDefault) {
            await clearOtherDefaults(transaction, account.id);
          }

          return transaction.emailAccount.findUniqueOrThrow({
            where: { id: account.id },
            include: accountInclude,
          });
        });
      } catch (error) {
        translateUniqueViolation(error);
      }
    }),

  setDefault: permissionProcedure(PERMISSIONS.EMAIL_ACCOUNTS_MANAGE)
    .input(emailAccountSetDefaultSchema)
    .mutation(async ({ input }) => {
      return db.$transaction(async (transaction) => {
        await getAccountOrThrow(transaction, input.id);
        await clearOtherDefaults(transaction, input.id);

        return transaction.emailAccount.update({
          where: { id: input.id },
          data: { isDefault: true },
        });
      });
    }),

  setActive: permissionProcedure(PERMISSIONS.EMAIL_ACCOUNTS_MANAGE)
    .input(emailAccountSetActiveSchema)
    .mutation(async ({ input }) => {
      await getAccountOrThrow(db, input.id);

      return db.emailAccount.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),

  setUserPermissions: permissionProcedure(PERMISSIONS.EMAIL_ACCOUNTS_MANAGE)
    .input(emailAccountSetUserPermissionsSchema)
    .mutation(async ({ input }) => {
      const uniqueUserIds = [...new Set(input.userIds)];

      return db.$transaction(async (transaction) => {
        await getAccountOrThrow(transaction, input.id);

        await transaction.emailAccountUserPermission.deleteMany({
          where: { emailAccountId: input.id },
        });

        if (uniqueUserIds.length > 0) {
          await transaction.emailAccountUserPermission.createMany({
            data: uniqueUserIds.map((userId) => ({
              userId,
              emailAccountId: input.id,
            })),
            skipDuplicates: true,
          });
        }

        return transaction.emailAccount.findUniqueOrThrow({
          where: { id: input.id },
          include: accountInclude,
        });
      });
    }),

  remove: permissionProcedure(PERMISSIONS.EMAIL_ACCOUNTS_MANAGE)
    .input(emailAccountIdSchema)
    .mutation(async ({ input }) => {
      // Delete only when no conversation references the account. The check and
      // the delete are one statement, so a conversation created concurrently
      // cannot be cascade-deleted behind our back.
      const deleted = await db.emailAccount.deleteMany({
        where: { id: input.id, conversations: { none: {} } },
      });

      if (deleted.count === 1) {
        return { id: input.id };
      }

      const existing = await db.emailAccount.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email account not found",
        });
      }

      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "This account has conversations and cannot be deleted. Deactivate it instead to keep its history.",
      });
    }),
});
