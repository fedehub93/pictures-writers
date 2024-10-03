"use server";

import * as z from "zod";

import { SubscribeSchema } from "@/schemas";
import { generateSubscriptionToken } from "@/lib/tokens";
import { sendSubscriptionEmail } from "@/lib/mail";
import { createContactByEmail } from "@/data/email-contact";
import { handleUserSubscribed } from "@/lib/event-handler";

export const subscribe = async (values: z.infer<typeof SubscribeSchema>) => {
  const validatedFields = SubscribeSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email } = validatedFields.data;

  const existingContact = await createContactByEmail(email, "user_subscribed");

  //  Send notification to admins
  await handleUserSubscribed();

  const subscriptionToken = await generateSubscriptionToken(email);

  await sendSubscriptionEmail(subscriptionToken.email, subscriptionToken.token);

  return { success: "Confirmation email sent!" };
};
