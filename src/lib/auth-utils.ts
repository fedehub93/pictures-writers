import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { UserRole } from "@/generated/prisma";
import { auth } from "./auth";

export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
};

export const requireAdminAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (
    !session ||
    (session.role !== UserRole.ADMIN && session.role !== UserRole.EDITOR)
  ) {
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
