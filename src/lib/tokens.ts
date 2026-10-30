import { v4 as uuidv4 } from "uuid";

import { getSubscriptionTokenByEmail } from "@/data/subscription-token";
import { normalizeEmail } from "@/shared/lib/email";
import { db } from "./db";

export const generateSubscriptionToken = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("A subscription token requires an email address.");
  }

  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getSubscriptionTokenByEmail(normalizedEmail);
  if (existingToken) {
    // Delete every spelling of the address, not just the row the lookup
    // returned: legacy signups may have left more than one token behind.
    await db.emailSubscriptionToken.deleteMany({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
    });
  }

  const subscriptionToken = await db.emailSubscriptionToken.create({
    data: {
      email: normalizedEmail,
      token,
      expires,
    },
  });

  return subscriptionToken;
};
