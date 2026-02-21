import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";
import { UserRole } from "@/prisma/generated";

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
