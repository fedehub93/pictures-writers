import "server-only";

import { Prisma } from "@/generated/prisma";
import { TRPCError } from "@trpc/server";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/authorization";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import {
  ADMIN_ROLE_KEY,
  REQUIRED_ADMIN_PERMISSIONS,
} from "../constants";
import {
  createRoleSchema,
  deleteRoleSchema,
  updateRoleSchema,
} from "../schemas";

const roleInclude = {
  permissions: { include: { permission: true } },
  _count: { select: { users: true } },
} satisfies Prisma.RoleInclude;

const ensurePermissionIdsExist = async (permissionIds: string[]) => {
  const permissions = await db.permission.findMany({
    where: { id: { in: permissionIds } },
    select: { id: true },
  });

  if (permissions.length !== new Set(permissionIds).size) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "One or more permissions are not in the system catalog",
    });
  }
};

const throwIfDuplicateName = async (name: string, id?: string) => {
  const duplicate = await db.role.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      id: id ? { not: id } : undefined,
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A role with this name already exists",
    });
  }
};

const ensureAdminInvariant = (
  isActive: boolean,
  permissionIds: string[],
  catalog: { id: string; key: string }[],
) => {
  const adminPermissions = new Set(
    permissionIds
      .map((id) => catalog.find((permission) => permission.id === id)?.key)
      .filter((key): key is string => Boolean(key)),
  );

  if (
    !isActive ||
    REQUIRED_ADMIN_PERMISSIONS.some((key) => !adminPermissions.has(key))
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ADMIN must remain active and retain role management access",
    });
  }
};

export const rolesRouter = createTRPCRouter({
  getMany: permissionProcedure(PERMISSIONS.ROLES_READ).query(() =>
    db.role.findMany({
      include: roleInclude,
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
  ),
  getCatalog: permissionProcedure(PERMISSIONS.ROLES_READ).query(() =>
    db.permission.findMany({ orderBy: [{ area: "asc" }, { action: "asc" }] }),
  ),
  create: permissionProcedure(PERMISSIONS.ROLES_MANAGE)
    .input(createRoleSchema)
    .mutation(async ({ input }) => {
      await throwIfDuplicateName(input.name);
      await ensurePermissionIdsExist(input.permissionIds);
      const role = await db.role.create({
        data: {
          key: `CUSTOM_${crypto.randomUUID()}`,
          name: input.name,
          permissions: {
            create: input.permissionIds.map((permissionId) => ({ permissionId })),
          },
        },
        include: roleInclude,
      });
      return role;
    }),
  update: permissionProcedure(PERMISSIONS.ROLES_MANAGE)
    .input(updateRoleSchema)
    .mutation(async ({ input }) => {
      const role = await db.role.findUnique({
        where: { id: input.id },
        include: { _count: { select: { users: true } } },
      });
      if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
      if (!input.isActive && role._count.users > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Reassign users before deactivating this role" });
      }
      await throwIfDuplicateName(input.name, role.id);
      await ensurePermissionIdsExist(input.permissionIds);
      const catalog = await db.permission.findMany({ select: { id: true, key: true } });
      if (role.key === ADMIN_ROLE_KEY) {
        ensureAdminInvariant(input.isActive, input.permissionIds, catalog);
      }
      await db.$transaction(async (transaction) => {
        await transaction.role.update({ where: { id: role.id }, data: { name: input.name, isActive: input.isActive } });
        await transaction.rolePermission.deleteMany({ where: { roleId: role.id } });
        if (input.permissionIds.length) {
          await transaction.rolePermission.createMany({ data: input.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })) });
        }
      });
      return db.role.findUniqueOrThrow({ where: { id: role.id }, include: roleInclude });
    }),
  remove: permissionProcedure(PERMISSIONS.ROLES_MANAGE)
    .input(deleteRoleSchema)
    .mutation(async ({ input }) => {
      const role = await db.role.findUnique({ where: { id: input.id }, include: { _count: { select: { users: true } } } });
      if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
      if (role.isSystem) throw new TRPCError({ code: "BAD_REQUEST", message: "System roles cannot be removed" });
      if (role._count.users > 0) throw new TRPCError({ code: "CONFLICT", message: "Reassign users before removing this role" });
      return db.role.delete({ where: { id: role.id } });
    }),
});
