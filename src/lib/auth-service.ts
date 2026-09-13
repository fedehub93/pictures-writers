import { headers } from "next/headers";
import { getAuthorizedUser, PERMISSIONS } from "@/shared/lib/authorization";

import { auth } from "./auth";

export const authAdmin = async (
  permission: string = PERMISSIONS.DASHBOARD_READ,
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return getAuthorizedUser(session.id, permission);
};
