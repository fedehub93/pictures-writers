import { v4 as uuidv4 } from "uuid";

import { getSubscriptionTokenByEmail } from "@/data/subscription-token";
import { db } from "./db";

export const generateSubscriptionToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getSubscriptionTokenByEmail(email);
  if (existingToken) {
    await db.emailSubscriptionToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  const subscriptionToken = await db.emailSubscriptionToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return subscriptionToken;
};
