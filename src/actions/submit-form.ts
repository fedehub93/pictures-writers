"use server";

import { createContactByEmail } from "@/data/email-contact";
import { emitFormSubmitted } from "@/modules/forms/automations/emit";
import { handleFormSubmitted } from "@/lib/event-handler";

import { verifyRecaptcha } from "@/lib/recaptcha";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/shared/lib/email";

export type FormActionResponse = {
  success: boolean;
  message: string;
};

export const submitForm = async (
  formId: string,
  values: Record<string, any>,
  recaptchaToken: string,
): Promise<FormActionResponse> => {
  try {
    // 1. Verify reCAPTCHA first
    const recaptchaResult = await verifyRecaptcha(
      recaptchaToken,
      "submit_form",
    );

    if (!recaptchaResult.success) {
      return {
        success: false,
        message:
          recaptchaResult.error ||
          "Security verification failed. Please try again.",
      };
    }

    // Recupera il form per validare che esista
    const form = await db.form.findUnique({
      where: { id: formId },
      select: { id: true },
    });

    if (!form) {
      return { success: false, message: "Form not found" };
    }

    if (typeof values !== "object" || Array.isArray(values)) {
      return { success: false, message: "Invalid submission data format" };
    }

    const emailFromBody =
      typeof values.email === "string" ? normalizeEmail(values.email) : null;

    if (!emailFromBody) {
      return {
        success: false,
        message: "Email non valida! Riprovare.",
      };
    }

    // The submission keeps the typed answers in `data` and stores the canonical
    // address in `email`, so both the audit trail and the joins stay correct.
    await db.formSubmission.create({
      data: {
        formId: formId,
        email: emailFromBody,
        data: values,
      },
    });

    const contact = await createContactByEmail(emailFromBody, "submit_form");

    // Start any automation listening for this internal event. The forms module
    // uses the canonical address as the idempotency key so a repeated
    // submission from the same person cannot start a second nurture cycle
    // (ADR-0005).
    try {
      await emitFormSubmitted({
        formId,
        email: contact?.email ?? emailFromBody,
        contactId: contact?.id ?? null,
        data: values,
      });
    } catch (automationError) {
      console.error("Error enqueuing form.submitted automation: ", automationError);
    }

    //  Send notification to admins
    await handleFormSubmitted();

    return {
      success: true,
      message: "Form inviato con successo!",
    };
  } catch (error) {
    console.error("Error submitting dynamic form: ", error);
    return {
      success: false,
      message: "Qualcosa è andato storto! Riprovare.",
    };
  }
};
