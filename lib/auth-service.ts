import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { db } from "./db";

export const authAdmin = async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: {
      externalUserId: userId,
      role: UserRole.ADMIN,
    },
  });

  // TODO: add email in prisma schema

  if (!user) {
    return null;
  }

  return user;
};
