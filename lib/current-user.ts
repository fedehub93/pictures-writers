import { currentUser } from "@clerk/nextjs";
import { db } from "./db";

export const getSelf = async () => {
  const self = await currentUser();

  if (!self) {
    return null;
  }

  const user = await db.user.findUnique({
    where: {
      externalUserId: self.id,
    },
  });

  // TODO: delete email

  if (!user) {
    return null;
  }

  return { ...user, email: self.emailAddresses[0].emailAddress };
};
