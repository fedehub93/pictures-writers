import { headers } from "next/headers";
import { getAuthorizedUser, PERMISSIONS } from "@/shared/lib/authorization";

import { auth } from "./auth";

export const authAdmin = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return getAuthorizedUser(session.id, PERMISSIONS.DASHBOARD_READ);
};
