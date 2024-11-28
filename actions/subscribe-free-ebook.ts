"use server";

import * as v from "valibot";

import { FreeEbookSchemaValibot } from "@/schemas";
import { sendFreeEbookEmail } from "@/lib/mail";
import { createContactByEmail } from "@/data/email-contact";
import { handleEbookDownloaded } from "@/lib/event-handler";

export const subscribeFreeEbook = async (
  values: v.InferInput<typeof FreeEbookSchemaValibot>
) => {
  try {
    const validatedFields = v.parse(FreeEbookSchemaValibot, values);

    // if (!validatedFields.success) {
    //   return { error: "Invalid fields!" };
    // }

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
        error: "C'è stato un errore durante l'invio della mail. Riprova.",
      };
    }

    return {
      success:
        "È stata inviata una email al tuo indirizzo dove puoi scaricare l'eBook gratuito!",
    };
  } catch (error) {
    return {
      error: "Invalid fields!",
    };
  }
};
