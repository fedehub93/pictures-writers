import "server-only";

import { db } from "@/shared/lib/db";
import { hasPermission, type PermissionKey } from "./permissions";

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
