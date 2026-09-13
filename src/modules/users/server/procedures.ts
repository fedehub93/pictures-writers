import "server-only";

import { Prisma } from "@/generated/prisma";
import { TRPCError } from "@trpc/server";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/authorization";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import { assertAccountChangeAllowed, hasManagementPermissions } from "../lib/account-policy";
import { userListSchema, updateStatusSchema, updateUserSchema } from "../schemas";

const roleSelect = {
  id: true,
  key: true,
  name: true,
  isActive: true,
  permissions: { select: { permission: { select: { key: true } } } },
} satisfies Prisma.RoleSelect;

const userSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  imageUrl: true,
  bio: true,
  accountStatus: true,
  createdAt: true,
  updatedAt: true,
  roleDefinition: { select: roleSelect },
} satisfies Prisma.UserSelect;

type DbClient = typeof db | Prisma.TransactionClient;

const getQualifiedAdministratorCount = async (client: DbClient) => {
  const users = await client.user.findMany({
    where: { accountStatus: "ACTIVE", roleDefinition: { is: { isActive: true } } },
    select: { id: true, accountStatus: true, roleDefinition: { select: roleSelect } },
  });
  return users.filter(hasManagementPermissions).length;
};

const getTarget = async (client: DbClient, id: string) => {
  const user = await client.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  return user;
};

const getActiveRole = async (client: DbClient, id: string) => {
  const role = await client.role.findUnique({ where: { id }, select: roleSelect });
  if (!role || !role.isActive) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Users can only be assigned an active role" });
  }
  return role;
};

export const usersRouter = createTRPCRouter({
  getMany: permissionProcedure(PERMISSIONS.USERS_READ)
    .input(userListSchema)
    .query(async ({ input }) => {
      const where: Prisma.UserWhereInput = {
        roleId: input.roleId,
        accountStatus: input.accountStatus,
        OR: input.search
          ? [
              { email: { contains: input.search, mode: "insensitive" } },
              { name: { contains: input.search, mode: "insensitive" } },
              { firstName: { contains: input.search, mode: "insensitive" } },
              { lastName: { contains: input.search, mode: "insensitive" } },
            ]
          : undefined,
      };
      const orderBy = { [input.sort]: input.direction } as Prisma.UserOrderByWithRelationInput;
      const [users, total, roles] = await Promise.all([
        db.user.findMany({
          where,
          select: userSelect,
          orderBy,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        db.user.count({ where }),
        db.role.findMany({
          where: { isActive: true },
          select: { id: true, key: true, name: true },
          orderBy: { name: "asc" },
        }),
      ]);
      return { users, total, page: input.page, pageSize: input.pageSize, roles };
    }),
  update: permissionProcedure(PERMISSIONS.USERS_MANAGE)
    .input(updateUserSchema)
    .mutation(async ({ input, ctx }) => {
      return db.$transaction(async (transaction) => {
        const target = await getTarget(transaction, input.id);
        const role = await getActiveRole(transaction, input.roleId);
        assertAccountChangeAllowed({
          actorId: ctx.auth.id,
          target,
          changesRole: target.roleDefinition?.id !== role.id,
          changesStatus: false,
          qualifiedAdministratorCount: await getQualifiedAdministratorCount(transaction),
          resultingUser: { ...target, roleDefinition: role },
        });
        return transaction.user.update({
          where: { id: input.id },
          data: { firstName: input.firstName, lastName: input.lastName, bio: input.bio, imageUrl: input.imageUrl, roleId: role.id },
          select: userSelect,
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }),
  updateStatus: permissionProcedure(PERMISSIONS.USERS_MANAGE)
    .input(updateStatusSchema)
    .mutation(async ({ input, ctx }) => {
      return db.$transaction(async (transaction) => {
        const target = await getTarget(transaction, input.id);
        assertAccountChangeAllowed({
          actorId: ctx.auth.id,
          target,
          changesRole: false,
          changesStatus: target.accountStatus !== input.accountStatus,
          qualifiedAdministratorCount: await getQualifiedAdministratorCount(transaction),
          resultingUser: { ...target, accountStatus: input.accountStatus },
        });
        return transaction.user.update({ where: { id: input.id }, data: { accountStatus: input.accountStatus }, select: userSelect });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }),
});
