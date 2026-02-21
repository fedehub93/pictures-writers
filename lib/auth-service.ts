import { headers } from "next/headers";
import { UserRole } from "@/generated/prisma";
import { db } from "@/lib/db";

import { auth } from "./auth";

export const authAdmin = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: {
      id: session.id,
      role: UserRole.ADMIN,
    },
  });


  if (!user) {
    return null;
  }

  return user;
};
