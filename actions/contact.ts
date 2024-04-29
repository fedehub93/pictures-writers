"use server";

import * as z from "zod";

import { db } from "@/lib/db";
import { ContactSchema } from "@/schemas";

export const contact = async (values: z.infer<typeof ContactSchema>) => {
  const validatedFields = ContactSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { name, email, subject, message } = validatedFields.data;

  await db.contactForm.create({
    data: {
      name,
      email,
      subject,
      message,
    },
  });

  return { success: "Operazione eseguita con successo!" };
};
