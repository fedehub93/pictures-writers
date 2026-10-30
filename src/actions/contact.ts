"use server";

import type { z } from "zod/mini";

import { db } from "@/lib/db";
import { ContactSchema } from "@/schemas";
import { createContactByEmail } from "@/data/email-contact";
import { handleContactRequested } from "@/lib/event-handler";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { normalizeEmail } from "@/shared/lib/email";
import { BUILT_IN_CONTACT_FORM_ID } from "@/modules/forms/built-in-forms";
import { emitFormSubmitted } from "@/modules/forms/automations/emit";

export const contact = async (
  values: z.input<typeof ContactSchema>,
  recaptchaToken: string,
) => {
  try {
    // 1. Verify reCAPTCHA first
    const recaptchaResult = await verifyRecaptcha(
      recaptchaToken,
      "contact_form",
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
    const validatedFields = ContactSchema.parse(values);
    const { name, subject, message } = validatedFields;
    const email = normalizeEmail(validatedFields.email);

    if (!email) {
      return {
        success: false,
        message: "Email non valida! Riprovare.",
      };
    }

    await db.formSubmission.create({
      data: {
        formId: BUILT_IN_CONTACT_FORM_ID,
        email,
        data: {
          name,
          email: validatedFields.email,
          subject,
          message,
        },
      },
    });

    const contact = await createContactByEmail(email, "contact_requested");

    // Start any automation listening for this internal event. The forms module
    // uses the canonical address as the idempotency key so a repeated
    // submission from the same person cannot start a second nurture cycle
    // (ADR-0005).
    try {
      await emitFormSubmitted({
        formId: BUILT_IN_CONTACT_FORM_ID,
        email: contact?.email ?? email,
        contactId: contact?.id ?? null,
        data: { name, email: validatedFields.email, subject, message },
      });
    } catch (automationError) {
      console.error(
        "Error enqueuing form.submitted automation: ",
        automationError,
      );
    }

    //  Send notification to admins
    await handleContactRequested();

    return {
      success: true,
      message: "Operazione eseguita con successo!",
    };
  } catch (error) {
    console.error("Error submitting contact form: ", error);
    return {
      success: false,
      message: "Failed to send your message. Please try again later.",
    };
  }
};
