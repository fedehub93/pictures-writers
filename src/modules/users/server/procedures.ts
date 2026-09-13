import "server-only";

import { Prisma } from "@/generated/prisma";
import { TRPCError } from "@trpc/server";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/authorization";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import { assertAccountChangeAllowed, hasManagementPermissions } from "../lib/account-policy";
import { activityHistorySchema, createInvitationSchema, invitationIdSchema, requestPasswordResetSchema, userListSchema, updateStatusSchema, updateUserSchema } from "../schemas";
import { createInvitationToken, invitationExpiry } from "../lib/invitation-token";
import { sendInvitationEmail } from "./emails";
import { auth } from "@/shared/lib/auth";
import { recordAdministrativeActivity } from "@/modules/administrative-activity";

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
  update: permissionProcedure(PERMISSIONS.USERS_UPDATE)
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
        const updated = await transaction.user.update({
          where: { id: input.id },
          data: { firstName: input.firstName, lastName: input.lastName, bio: input.bio, imageUrl: input.imageUrl, roleId: role.id },
          select: userSelect,
        });
        await recordAdministrativeActivity(transaction, {
          actorId: ctx.auth.id, action: "USER_UPDATED", area: "USERS", targetType: "USER", targetId: target.id, outcome: "SUCCESS",
          before: { firstName: target.firstName, lastName: target.lastName, bio: target.bio, imageUrl: target.imageUrl, roleId: target.roleDefinition?.id ?? null },
          after: { firstName: updated.firstName, lastName: updated.lastName, bio: updated.bio, imageUrl: updated.imageUrl, roleId: updated.roleDefinition?.id ?? null },
        });
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }),
  updateStatus: permissionProcedure(PERMISSIONS.USERS_UPDATE)
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
        const updated = await transaction.user.update({ where: { id: input.id }, data: { accountStatus: input.accountStatus }, select: userSelect });
        await recordAdministrativeActivity(transaction, {
          actorId: ctx.auth.id, action: input.accountStatus === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED", area: "USERS", targetType: "USER", targetId: target.id, outcome: "SUCCESS",
          before: { accountStatus: target.accountStatus }, after: { accountStatus: updated.accountStatus },
        });
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }),
  getInvitations: permissionProcedure(PERMISSIONS.USERS_READ).query(async () => {
    const invitations = await db.invitation.findMany({
      include: { role: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return invitations.map(({ tokenHash: _tokenHash, ...invitation }) => ({
      ...invitation,
      status: invitation.status === "PENDING" && invitation.expiresAt <= new Date() ? "EXPIRED" as const : invitation.status,
    }));
  }),
  getActivityHistory: permissionProcedure(PERMISSIONS.USERS_READ)
    .input(activityHistorySchema)
    .query(({ input }) => (db as typeof db & { administrativeActivity: Prisma.AdministrativeActivityDelegate }).administrativeActivity.findMany({
      where: { targetType: "USER", targetId: input.userId },
      include: { actor: { select: { id: true, name: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })),
  createInvitation: permissionProcedure(PERMISSIONS.USERS_CREATE)
    .input(createInvitationSchema)
    .mutation(async ({ input, ctx }) => {
      const role = await getActiveRole(db, input.roleId);
      const existingUser = await db.user.findFirst({ where: { email: { equals: input.email, mode: "insensitive" } }, select: { id: true } });
      if (existingUser) throw new TRPCError({ code: "CONFLICT", message: "A user with this email already exists" });
      const pending = await db.invitation.findFirst({ where: { email: { equals: input.email, mode: "insensitive" }, status: "PENDING", expiresAt: { gt: new Date() } }, select: { id: true } });
      if (pending) throw new TRPCError({ code: "CONFLICT", message: "A pending invitation already exists for this email" });
      const { token, tokenHash } = createInvitationToken();
      let invitation;
      try {
        invitation = await db.invitation.create({ data: { email: input.email, roleId: role.id, createdById: ctx.auth.id, tokenHash, expiresAt: invitationExpiry() }, include: { role: { select: { name: true } } } });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new TRPCError({ code: "CONFLICT", message: "A pending invitation already exists for this email" });
        throw error;
      }
      try {
        if (!(await sendInvitationEmail(invitation.email, token, invitation.role.name))) throw new Error("Email delivery is not configured");
      } catch (error) {
        await db.invitation.update({ where: { id: invitation.id }, data: { status: "CANCELLED", tokenHash: `cancelled-${crypto.randomUUID()}` } });
        await recordAdministrativeActivity(db, {
          actorId: ctx.auth.id, action: "INVITATION_CREATED", area: "INVITATIONS", targetType: "INVITATION", targetId: invitation.id, outcome: "FAILURE",
          after: { email: invitation.email, role: invitation.role.name, status: "CANCELLED" },
        });
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "Invitation delivery failed" });
      }
       await recordAdministrativeActivity(db, {
         actorId: ctx.auth.id, action: "INVITATION_CREATED", area: "INVITATIONS", targetType: "INVITATION", targetId: invitation.id, outcome: "SUCCESS",
         after: { email: invitation.email, role: invitation.role.name, status: invitation.status, expiresAt: invitation.expiresAt.toISOString() },
       });
       return invitation;
    }),
  resendInvitation: permissionProcedure(PERMISSIONS.USERS_MANAGE)
    .input(invitationIdSchema)
    .mutation(async ({ input, ctx }) => {
      const invitation = await db.invitation.findUnique({ where: { id: input.id }, include: { role: { select: { name: true } } } });
      if (!invitation || invitation.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending invitations can be resent" });
      const { token, tokenHash } = createInvitationToken();
      const updated = await db.invitation.update({ where: { id: invitation.id }, data: { tokenHash, expiresAt: invitationExpiry() } });
      try {
        if (!(await sendInvitationEmail(updated.email, token, invitation.role.name))) throw new Error("Email delivery is not configured");
      } catch (error) {
        await db.invitation.update({ where: { id: invitation.id }, data: { tokenHash: invitation.tokenHash, expiresAt: invitation.expiresAt } });
        await recordAdministrativeActivity(db, {
          actorId: ctx.auth.id, action: "INVITATION_RESENT", area: "INVITATIONS", targetType: "INVITATION", targetId: invitation.id, outcome: "FAILURE",
          after: { email: invitation.email, role: invitation.role.name, status: invitation.status },
        });
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "Invitation delivery failed" });
      }
       await recordAdministrativeActivity(db, {
         actorId: ctx.auth.id, action: "INVITATION_RESENT", area: "INVITATIONS", targetType: "INVITATION", targetId: invitation.id, outcome: "SUCCESS",
         before: { status: invitation.status, expiresAt: invitation.expiresAt.toISOString() }, after: { status: updated.status, expiresAt: updated.expiresAt.toISOString() },
       });
       return updated;
    }),
  cancelInvitation: permissionProcedure(PERMISSIONS.USERS_MANAGE)
    .input(invitationIdSchema)
    .mutation(async ({ input, ctx }) => {
       const invitation = await db.invitation.findUnique({ where: { id: input.id }, select: { status: true, email: true, role: { select: { name: true } } } });
      if (!invitation || invitation.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending invitations can be cancelled" });
       const cancelled = await db.invitation.update({ where: { id: input.id }, data: { status: "CANCELLED", tokenHash: `cancelled-${crypto.randomUUID()}` } });
       await recordAdministrativeActivity(db, {
         actorId: ctx.auth.id, action: "INVITATION_CANCELLED", area: "INVITATIONS", targetType: "INVITATION", targetId: input.id, outcome: "SUCCESS",
         before: { email: invitation.email, role: invitation.role.name, status: invitation.status }, after: { status: cancelled.status },
       });
       return cancelled;
    }),
  requestPasswordReset: permissionProcedure(PERMISSIONS.USERS_MANAGE)
    .input(requestPasswordResetSchema)
    .mutation(async ({ input, ctx }) => {
       const user = await db.user.findUnique({ where: { email: input.email }, select: { id: true, email: true } });
       if (!user) return { sent: true };
       try {
         await auth.api.requestPasswordReset({ body: { email: input.email, redirectTo: "/reset-password" } });
       } catch (error) {
         await recordAdministrativeActivity(db, {
           actorId: ctx.auth.id, action: "PASSWORD_RESET_REQUESTED", area: "USERS", targetType: "USER", targetId: user.id, outcome: "FAILURE",
           after: { email: user.email },
         });
         throw error;
       }
       await recordAdministrativeActivity(db, {
         actorId: ctx.auth.id, action: "PASSWORD_RESET_REQUESTED", area: "USERS", targetType: "USER", targetId: user.id, outcome: "SUCCESS",
         after: { email: user.email },
       });
       return { sent: true };
    }),
});
