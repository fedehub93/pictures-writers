"use server";

import type { z } from "zod/mini";

import { SubscribeSchema } from "@/schemas";
import { generateSubscriptionToken } from "@/lib/tokens";
import { sendSubscriptionEmail } from "@/modules/mails/lib/mail";
import { createContactByEmail } from "@/data/email-contact";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { normalizeEmail } from "@/shared/lib/email";
import { BUILT_IN_NEWSLETTER_FORM_ID } from "@/modules/forms/built-in-forms";
import { emitFormSubmitted } from "@/modules/forms/automations/emit";

export const subscribe = async (
  values: z.input<typeof SubscribeSchema>,
  recaptchaToken: string,
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
    const validatedFields = SubscribeSchema.parse(values);
    const email = normalizeEmail(validatedFields.email);

    if (!email) {
      return {
        success: false,
        message: "Email non valida! Riprovare.",
      };
    }

    const existingContact = await createContactByEmail(email);

    if (!existingContact) {
      return {
        success: false,
        message: "Qualcosa è andato storto! Riprovare.",
      };
    }

    // Start any automation listening for this internal event. The forms module
    // uses the canonical address as the idempotency key so a repeated
    // subscription from the same person cannot start a second nurture cycle
    // (ADR-0005). The payload carries the stored contact's address, not the
    // freshly typed one.
    try {
      await emitFormSubmitted({
        formId: BUILT_IN_NEWSLETTER_FORM_ID,
        email: existingContact.email,
        contactId: existingContact.id,
        data: { email: existingContact.email },
      });
    } catch (automationError) {
      console.error(
        "Error enqueuing form.submitted automation: ",
        automationError,
      );
    }

    const subscriptionToken = await generateSubscriptionToken(
      existingContact.email,
    );

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
