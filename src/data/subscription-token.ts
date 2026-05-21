import { db } from "@/lib/db";

export const getSubscriptionTokenByToken = async (token: string) => {
  try {
    const subscriptionToken = await db.emailSubscriptionToken.findUnique({
      where: { token },
    });

    return subscriptionToken;
  } catch {
    return null;
  }
};

export const getSubscriptionTokenByEmail = async (email: string) => {
  try {
    const subscriptionToken = await db.emailSubscriptionToken.findFirst({
      where: { email },
    });

    return subscriptionToken;
  } catch {
    return null;
  }
};
