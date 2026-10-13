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

export const createContactByEmail = async (
  email: string,
  interactionType?: string
) => {
  let contact = await getContactByEmail(email);

  if (!contact) {
    contact = await db.emailContact.create({
      data: {
        email,
        isSubscriber: true,
      },
    });
  }

  if (interactionType) {
    await addContactInteraction(contact.id, interactionType);
  }

  return contact;
};

export const addContactInteraction = async (
  contactId: string,
  interactionType: string
) => {
  return await db.emailContactInteraction.upsert({
    where: {
      contactId_interactionType: {
        contactId,
        interactionType,
      },
    },
    update: {},
    create: {
      contactId,
      interactionType,
    },
  });
};

