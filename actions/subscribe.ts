"use server";

import * as z from "zod";

import { db } from "@/lib/db";
import { SubscribeSchema } from "@/schemas";
import { generateSubscriptionToken } from "@/lib/tokens";
import { sendSubscriptionEmail } from "@/lib/mail";
import { getContactByEmail } from "@/data/email-contact";

export const subscribe = async (values: z.infer<typeof SubscribeSchema>) => {
  const validatedFields = SubscribeSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email } = validatedFields.data;

  const existingContact = await getContactByEmail(email);

  if (existingContact) {
    return { error: "Email already in use!" };
  }

  await db.emailContact.create({
    data: {
      email,
    },
  });

  const subscriptionToken = await generateSubscriptionToken(email);

  await sendSubscriptionEmail(subscriptionToken.email, subscriptionToken.token);

  return { success: "Confirmation email sent!" };
};
