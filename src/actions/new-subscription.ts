"use server";

import { db } from "@/lib/db";
import { getSubscriptionTokenByToken } from "@/data/subscription-token";
import {
  addContactInteraction,
  getContactByEmail,
} from "@/data/email-contact";
import { createContactOnProvider } from "@/modules/mails/lib/core";
import { emitSubscriptionConfirmed } from "@/modules/mails/automations/emit";
import { handleUserSubscribed } from "@/lib/event-handler";

export const newSubscription = async (token: string) => {
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

  // `emailVerified` is the marker of a first-time confirmation: it is only set
  // here, so a null value means the address has never been confirmed before.
  const wasVerified = existingUser.emailVerified != null;

  await db.emailContact.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    },
  });

  if (!wasVerified) {
    await addContactInteraction(existingUser.id, "user_subscribed");
    await handleUserSubscribed();

    // Never let an automation error break the public confirmation flow.
    try {
      await emitSubscriptionConfirmed({
        email: existingToken.email,
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
