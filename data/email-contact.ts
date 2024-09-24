import { db } from "@/lib/db";

export const getContactByEmail = async (email: string) => {
  try {
    const emailContact = await db.emailContact.findFirst({
      where: { email },
    });

    return emailContact;
  } catch (error) {
    return null;
  }
};

export const getContactById = async (id: string) => {
  try {
    const emailContact = await db.emailContact.findUnique({
      where: { id },
    });

    return emailContact;
  } catch (error) {
    return null;
  }
};

export const createContactByEmail = async (email: string) => {
  const existingContact = await getContactByEmail(email);

  if (!existingContact) {
    const newContact = await db.emailContact.create({
      data: {
        email,
        isSubscriber: true,
        emailVerified: new Date(),
      },
    });

    return newContact;
  }

  return existingContact;
};
