"use server";

import * as v from "valibot";

import { FreeEbookSchemaValibot } from "@/schemas";
import { sendFreeEbookEmail } from "@/lib/mail";
import { createContactByEmail } from "@/data/email-contact";
import { handleEbookDownloaded } from "@/lib/event-handler";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const subscribeFreeEbook = async (
  values: v.InferInput<typeof FreeEbookSchemaValibot>,
  recaptchaToken: string
) => {
  try {
    // 1. Verify reCAPTCHA first
    const recaptchaResult = await verifyRecaptcha(
      recaptchaToken,
      "subscribe_product"
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
      "ebook_downloaded"
    );

    const isEmailSent = await sendFreeEbookEmail(email, rootId!, format);
    //  Send notification to admins
    await handleEbookDownloaded();

    if (!isEmailSent) {
      return {
        success: false,
        message: "C'è stato un errore durante l'invio della mail. Riprova.",
      };
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
