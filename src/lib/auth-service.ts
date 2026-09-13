import { headers } from "next/headers";
import {
  getAuthorizedUserForProcedure,
  PERMISSIONS,
} from "@/shared/lib/authorization";

import { auth } from "@/shared/lib/auth";

export const authAdmin = async (
  permission: string = PERMISSIONS.DASHBOARD_READ,
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return getAuthorizedUserForProcedure(session.id, permission);
};
