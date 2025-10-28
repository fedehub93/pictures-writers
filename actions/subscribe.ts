"use server";

import * as v from "valibot";

import { SubscribeSchemaValibot } from "@/schemas";
import { generateSubscriptionToken } from "@/lib/tokens";
import { sendSubscriptionEmail } from "@/lib/mail";
import { createContactByEmail } from "@/data/email-contact";
import { handleUserSubscribed } from "@/lib/event-handler";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const subscribe = async (
  values: v.InferInput<typeof SubscribeSchemaValibot>,
  recaptchaToken: string
) => {
  try {
    // 1. Verify reCAPTCHA first
    const recaptchaResult = await verifyRecaptcha(
      recaptchaToken,
      "subscribe_newsletter"
    );
    console.log(recaptchaResult);
    if (!recaptchaResult.success) {
      return {
        success: false,
        message:
          recaptchaResult.error ||
          "Security verification faield. Please try again.",
      };
    }

    // 2. Validate the form data
    const validatedFields = v.parse(SubscribeSchemaValibot, values);
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

    return {
      success: true,
      message: "Email di conferma inviata!",
    };
  } catch (error) {
    console.error("Error submitting contact form: ", error);
    return {
      success: false,
      message: "Qualcosa è andato storto! Riprovare.",
    };
  }
};
