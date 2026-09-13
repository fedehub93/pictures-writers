import "server-only";

import { db } from "@/shared/lib/db";

export const PERMISSIONS = {
  DASHBOARD_READ: "dashboard.read",
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_MANAGE: "users.manage",
} as const;

export type PermissionKey = string;

export const can = (
  permissionKeys: readonly string[],
  requiredPermission: PermissionKey,
) => permissionKeys.includes(requiredPermission);

export const getAuthorizedUser = async (
  userId: string,
  requiredPermission?: PermissionKey,
) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      roleDefinition: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!user || user.accountStatus === "SUSPENDED" || !user.roleDefinition) {
    return null;
  }

  const permissionKeys = user.roleDefinition.permissions.map(
    ({ permission }) => permission.key,
  );

  const isProtectedAdmin =
    user.roleDefinition.isSystem && user.roleDefinition.key === "ADMIN";

  if (
    requiredPermission &&
    !isProtectedAdmin &&
    !can(permissionKeys, requiredPermission)
  ) {
    return null;
  }

  return { ...user, permissionKeys };
};
