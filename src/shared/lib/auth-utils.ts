import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/shared/lib/auth";
import {
  getAuthorizedUser,
  PERMISSIONS,
} from "@/shared/lib/authorization";

export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !(await getAuthorizedUser(session.id))) {
    redirect("/sign-in");
  }

  return session;
};

export const requireAdminAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !(await getAuthorizedUser(session.id, PERMISSIONS.DASHBOARD_READ))) {
    redirect("/sign-in");
  }

  return session;
};

export const requirePermission = async (permission: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !(await getAuthorizedUser(session.id, permission))) {
    redirect("/sign-in");
  }

  return session;
};

export const requireUnauth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/admin/dashboard");
  }
};
