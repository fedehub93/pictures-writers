"use server";

import * as z from "zod";

import { FreeEbookSchema } from "@/schemas";
import { sendFreeEbookEmail } from "@/lib/mail";
import { createContactByEmail } from "@/data/email-contact";
import { handleEbookDownloaded } from "@/lib/event-handler";

export const subscribeFreeEbook = async (
  values: z.infer<typeof FreeEbookSchema>
) => {
  const validatedFields = FreeEbookSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, ebookId } = validatedFields.data;

  const existingContact = await createContactByEmail(email, "ebook_downloaded");

  const isEmailSent = await sendFreeEbookEmail(email, ebookId!);
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
};
