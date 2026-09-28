"use server";

import * as v from "valibot";

import { db } from "@/lib/db";
import { ContactSchemaValibot } from "@/schemas";
import { createContactByEmail } from "@/data/email-contact";
import { handleContactRequested } from "@/lib/event-handler";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { BUILT_IN_CONTACT_FORM_ID } from "@/modules/forms/built-in-forms";

export const contact = async (
  values: v.InferInput<typeof ContactSchemaValibot>,
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
    const validatedFields = v.parse(ContactSchemaValibot, values);
    const { name, email, subject, message } = validatedFields;

    await db.formSubmission.create({
      data: {
        formId: BUILT_IN_CONTACT_FORM_ID,
        email,
        data: {
          name,
          email,
          subject,
          message,
        },
      },
    });

    await createContactByEmail(email, "contact_requested");

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
