"use server";

import * as v from "valibot";

import { SubscribeSchemaValibot } from "@/schemas";
import { generateSubscriptionToken } from "@/lib/tokens";
import { sendSubscriptionEmail } from "@/lib/mail";
import { createContactByEmail } from "@/data/email-contact";
import { handleUserSubscribed } from "@/lib/event-handler";

export const subscribe = async (
  values: v.InferInput<typeof SubscribeSchemaValibot>
) => {
  try {
    const validatedFields = v.parse(SubscribeSchemaValibot, values);

    // if (!validatedFields.success) {
    //   return { error: "Invalid fields!" };
    // }

    const { email } = validatedFields;

    const existingContact = await createContactByEmail(
      email,
      "user_subscribed"
    );

    //  Send notification to admins
    await handleUserSubscribed();

    const subscriptionToken = await generateSubscriptionToken(email);

    await sendSubscriptionEmail(
      subscriptionToken.email,
      subscriptionToken.token
    );

    return { success: "Confirmation email sent!" };
  } catch (errore) {
    return { error: "Qualcosa è andato storto!" };
  }
};
