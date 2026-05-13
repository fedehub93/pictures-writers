"use server";

import { createContactByEmail } from "@/data/email-contact";
import { handleFormSubmitted } from "@/lib/event-handler";

import { verifyRecaptcha } from "@/lib/recaptcha";
import { db } from "@/lib/db";

export const submitForm = async (
  formId: string,
  values: Record<string, string>,
  recaptchaToken: string,
) => {
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
      select: { id: true, fields: true },
    });

    if (!form) {
      return { success: false, message: "Form not found" };
    }

    if (typeof values !== "object" || Array.isArray(values)) {
      return { success: false, message: "Invalid submission data format" };
    }

    const emailFromBody = values.email || null;

    if (!emailFromBody) {
      return {
        success: false,
        message: "Email non valida! Riprovare.",
      };
    }

    // Salva la submission
    await db.formSubmission.create({
      data: {
        formId: formId,
        email: emailFromBody,
        data: values,
      },
    });

    await createContactByEmail(emailFromBody, "submit_form");

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
