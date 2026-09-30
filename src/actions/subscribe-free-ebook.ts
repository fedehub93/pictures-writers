"use server";

import * as v from "valibot";

import { FreeEbookSchemaValibot } from "@/schemas";
import { sendFreeEbookEmail } from "@/modules/mails/lib/mail";
import { createContactByEmail } from "@/data/email-contact";
import { handleEbookDownloaded } from "@/lib/event-handler";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { createContactOnProvider } from "@/modules/mails/lib/core";
import { BUILT_IN_EBOOK_FORM_ID } from "@/modules/forms/built-in-forms";
import { emitFormSubmitted } from "@/modules/forms/automations/emit";

export const subscribeFreeEbook = async (
  values: v.InferInput<typeof FreeEbookSchemaValibot>,
  recaptchaToken: string,
) => {
  try {
    // 1. Verify reCAPTCHA first
    const recaptchaResult = await verifyRecaptcha(
      recaptchaToken,
      "subscribe_product",
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
    const validatedFields = v.parse(FreeEbookSchemaValibot, values);
    const { email, rootId, format } = validatedFields;

    const existingContact = await createContactByEmail(
      email,
      "ebook_downloaded",
    );

    // Start any automation listening for this internal event. The forms module
    // chooses the idempotency key (the contact id) so a repeated download from
    // the same contact cannot start a second nurture cycle (ADR-0005).
    try {
      await emitFormSubmitted({
        formId: BUILT_IN_EBOOK_FORM_ID,
        email,
        contactId: existingContact.id,
        data: { email, rootId: rootId!, format },
      });
    } catch (automationError) {
      console.error(
        "Error enqueuing form.submitted automation: ",
        automationError,
      );
    }

    const isEmailSent = await sendFreeEbookEmail(email, rootId!, format);
    //  Send notification to admins
    await handleEbookDownloaded();

    if (!isEmailSent) {
      return {
        success: false,
        message: "C'è stato un errore durante l'invio della mail. Riprova.",
      };
    }

    try {
      await createContactOnProvider(existingContact.id);
    } catch (error) {
      console.error("Provider contact sync failed after ebook send:", error);
    }

    return {
      success: true,
      message:
        "È stata inviata una email al tuo indirizzo dove puoi scaricare l'eBook gratuito!",
    };
  } catch (error) {
    console.error("Error submitting contact form: ", error);
    return {
      success: false,
      message: "Qualcosa è andato storto! Riprovare.",
    };
  }
};
