import { db } from "@/lib/db";
import { normalizeEmail } from "@/shared/lib/email";

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
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  try {
    // Insensitive so tokens minted before the canonical write are still found
    // (and deleted) instead of leaving a second token for the same address.
    const subscriptionToken = await db.emailSubscriptionToken.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      orderBy: { createdAt: "asc" },
    });

    return subscriptionToken;
  } catch {
    return null;
  }
};
