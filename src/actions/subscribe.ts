"use server";

import * as v from "valibot";

import { SubscribeSchemaValibot } from "@/schemas";
import { generateSubscriptionToken } from "@/lib/tokens";
import { sendSubscriptionEmail } from "@/modules/mails/lib/mail";
import { createContactByEmail } from "@/data/email-contact";
import { handleUserSubscribed } from "@/lib/event-handler";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { BUILT_IN_NEWSLETTER_FORM_ID } from "@/modules/forms/built-in-forms";
import { emitFormSubmitted } from "@/modules/forms/automations/emit";

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

    // Start any automation listening for this internal event. The forms module
    // chooses the idempotency key (the contact id) so a repeated subscription
    // from the same contact cannot start a second nurture cycle (ADR-0005).
    try {
      await emitFormSubmitted({
        formId: BUILT_IN_NEWSLETTER_FORM_ID,
        email,
        contactId: existingContact.id,
        data: { email },
      });
    } catch (automationError) {
      console.error(
        "Error enqueuing form.submitted automation: ",
        automationError,
      );
    }

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
