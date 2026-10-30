"use server";

import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { getSubscriptionTokenByToken } from "@/data/subscription-token";
import {
  addContactInteraction,
  getContactByEmail,
} from "@/data/email-contact";
import { normalizeEmail } from "@/shared/lib/email";
import { createContactOnProvider } from "@/modules/mails/lib/core";
import { emitSubscriptionConfirmed } from "@/modules/mails/automations/emit";
import { handleUserSubscribed } from "@/lib/event-handler";

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export const newSubscription = async (token: string) => {
  const existingToken = await getSubscriptionTokenByToken(token);

  if (!existingToken) {
    return { error: "Token does not exist!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { error: "Token has expired" };
  }

  const tokenEmail = normalizeEmail(existingToken.email);
  if (!tokenEmail) {
    return { error: "Email does not exist!" };
  }

  const existingUser = await getContactByEmail(tokenEmail);
  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  // Write the canonical form, not the signup's typed form: confirmation is the
  // only place that rewrites an existing row, so leaving `existingToken.email`
  // here would undo the normalization on the first confirmation.
  const canonicalEmail = normalizeEmail(existingUser.email) ?? tokenEmail;

  // `emailVerified` is the marker of a first-time confirmation: it is only set
  // here, so a null value means the address has never been confirmed before.
  const wasVerified = existingUser.emailVerified != null;

  try {
    await db.emailContact.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: canonicalEmail,
      },
    });
  } catch (error) {
    // A legacy pair may match here: canonicalising the older row would collide
    // with its canonical twin. Confirming is more important than renaming, so
    // keep the stored spelling in that case (the pair is inert by design).
    if (
      !isUniqueConstraintError(error) ||
      canonicalEmail === existingUser.email
    ) {
      throw error;
    }

    await db.emailContact.update({
      where: { id: existingUser.id },
      data: { emailVerified: new Date() },
    });
  }

  if (!wasVerified) {
    await addContactInteraction(existingUser.id, "user_subscribed");
    await handleUserSubscribed();

    // Never let an automation error break the public confirmation flow.
    try {
      await emitSubscriptionConfirmed({
        email: canonicalEmail,
        contactId: existingUser.id,
        confirmedAt: new Date(),
      });
    } catch (error) {
      console.error(
        "Error enqueuing subscription.confirmed automation: ",
        error,
      );
    }
  }

  await db.emailSubscriptionToken.delete({
    where: { id: existingToken.id },
  });

  try {
    await createContactOnProvider(existingUser.id);
  } catch (error) {
    console.error("Provider contact sync failed after ebook send:", error);
  }

  return { success: "Email verified!" };
};
