import "server-only";

import { db } from "@/shared/lib/db";
import {
  getPermissionAlternatives,
  hasPermission,
  type PermissionKey,
} from "./permissions";

export { hasPermission as can, PERMISSIONS } from "./permissions";
export type { PermissionKey } from "./permissions";

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

  if (
    !user ||
    user.accountStatus === "SUSPENDED" ||
    !user.roleDefinition ||
    !user.roleDefinition.isActive
  ) {
    return null;
  }

  const permissionKeys = user.roleDefinition.permissions.map(
    ({ permission }) => permission.key,
  );

  if (requiredPermission && !hasPermission(permissionKeys, requiredPermission)) {
    return null;
  }

  return { ...user, permissionKeys };
};

export const getAuthorizedUserForPermissions = async (
  userId: string,
  requiredPermissions: readonly PermissionKey[],
) => {
  const user = await getAuthorizedUser(userId);
  if (!user || !requiredPermissions.some((permission) => hasPermission(user.permissionKeys, permission))) {
    return null;
  }

  return user;
};

export const getAuthorizedUserForProcedure = async (
  userId: string,
  permission: PermissionKey,
) => getAuthorizedUserForPermissions(userId, getPermissionAlternatives(permission));
