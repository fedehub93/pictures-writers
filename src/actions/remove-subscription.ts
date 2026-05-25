"use server";

import { db } from "@/lib/db";
import { getContactById } from "@/data/email-contact";
import { deleteContactOnProvider } from "@/modules/mails/lib/core";

export const removeSubscription = async (id: string) => {
  const existingContact = await getContactById(id);
  if (!existingContact) {
    return { error: "Email does not exist!" };
  }

  await db.emailContact.update({
    where: { id: existingContact.id },
    data: {
      isSubscriber: false,
    },
  });

  await deleteContactOnProvider(existingContact.id);

  return { success: "Email removed!" };
};
