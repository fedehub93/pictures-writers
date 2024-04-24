"use server";

import * as z from "zod";

import { db } from "@/lib/db";
import { FreeEbookSchema } from "@/schemas";
import { sendFreeEbookEmail } from "@/lib/mail";
import { getContactByEmail } from "@/data/email-contact";

export const subscribeFreeEbook = async (
  values: z.infer<typeof FreeEbookSchema>
) => {
  const validatedFields = FreeEbookSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, ebookId } = validatedFields.data;

  const existingContact = await getContactByEmail(email);

  if (!existingContact) {
    await db.emailContact.create({
      data: {
        email,
        isSubscriber: true,
      },
    });
  }

  await sendFreeEbookEmail(email, ebookId!);

  return { success: "Confirmation email sent!" };
};
