"use server";

import * as z from "zod";

import { db } from "@/lib/db";
import { FreeEbookSchema } from "@/schemas";
import { sendFreeEbookEmail } from "@/lib/mail";
import { createContactByEmail, getContactByEmail } from "@/data/email-contact";

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
