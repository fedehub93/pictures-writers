"use server";

import * as v from "valibot";

import { db } from "@/lib/db";
import { ContactSchemaValibot } from "@/schemas";
import { createContactByEmail } from "@/data/email-contact";
import { handleContactRequested } from "@/lib/event-handler";

export const contact = async (
  values: v.InferInput<typeof ContactSchemaValibot>
) => {
  try {
    const validatedFields = v.parse(ContactSchemaValibot, values);

    // if (!validatedFields.success) {
    //   return { error: "Invalid fields!" };
    // }

    // const { name, email, subject, message } = validatedFields.data;
    const { name, email, subject, message } = validatedFields;

    await db.contactForm.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    const existingContact = await createContactByEmail(
      email,
      "contact_requested"
    );

    //  Send notification to admins
    await handleContactRequested();

    return { success: "Operazione eseguita con successo!" };
  } catch (error) {
    return { error: "Invalid fields!" };
  }
};
