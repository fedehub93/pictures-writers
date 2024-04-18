"use server";

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { getSubscriptionTokenByToken } from "@/data/subscription-token";
import { getContactByEmail } from "@/data/email-contact";

export const newSubscription = async (token: string) => {
  console.log(token)
  const existingToken = await getSubscriptionTokenByToken(token);

  if (!existingToken) {
    return { error: "Token does not exist!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { error: "Token has expired" };
  }

  const existingUser = await getContactByEmail(existingToken.email);
  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  await db.emailContact.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    },
  });

  await db.emailSubscriptionToken.delete({
    where: { id: existingToken.id },
  });

  return { success: "Email verified!" };
};
