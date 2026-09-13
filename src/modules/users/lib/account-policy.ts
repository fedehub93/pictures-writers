import { TRPCError } from "@trpc/server";

import { REQUIRED_ADMIN_PERMISSIONS } from "@/modules/roles/constants";

export type AccountPolicyUser = {
  id: string;
  accountStatus: "ACTIVE" | "SUSPENDED";
  roleDefinition: { isActive: boolean; permissions: { permission: { key: string } }[] } | null;
};

export const hasManagementPermissions = (user: AccountPolicyUser) =>
  user.accountStatus === "ACTIVE" &&
  Boolean(user.roleDefinition) &&
  user.roleDefinition!.isActive &&
  REQUIRED_ADMIN_PERMISSIONS.every((required) =>
    user.roleDefinition!.permissions.some(
      ({ permission }) => permission.key === required,
    ),
  );

export const assertAccountChangeAllowed = ({
  actorId,
  target,
  changesRole,
  changesStatus,
  qualifiedAdministratorCount,
  resultingUser,
}: {
  actorId: string;
  target: AccountPolicyUser;
  changesRole: boolean;
  changesStatus: boolean;
  qualifiedAdministratorCount: number;
  resultingUser: AccountPolicyUser;
}) => {
  if (actorId === target.id && (changesRole || changesStatus)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You cannot change your own role or account status",
    });
  }

  if (
    hasManagementPermissions(target) &&
    !hasManagementPermissions(resultingUser) &&
    qualifiedAdministratorCount <= 1
  ) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "The last active administrator must retain management permissions",
    });
  }
};
