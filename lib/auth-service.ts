import { auth } from "@clerk/nextjs";
import { db } from "./db";
import { UserRole } from "@prisma/client";

export const authAdmin = async () => {
  const { userId } = auth();

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
