import { subMonths, startOfMonth, endOfMonth } from "date-fns";

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
  interactionType: string
) => {
  const existingContact = await getContactByEmail(email);

  if (!existingContact) {
    const newContact = await db.emailContact.create({
      data: {
        email,
        isSubscriber: true,
        emailVerified: new Date(),
      },
    });

    await addContactInteraction(newContact.id, interactionType);

    return newContact;
  }

  await addContactInteraction(existingContact.id, interactionType);

  return existingContact;
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

interface GrowthStats {
  currentMonthCount: number;
  lastMonthCount: number;
  absoluteGrowth: number;
  percentageGrowth: number;
}

export async function getEmailContactGrowth(): Promise<GrowthStats> {
  // Date del mese corrente (Settembre, se siamo a Settembre)
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = new Date(); // Fino ad ora (oggi)

  // Date del mese scorso (Agosto, se siamo a Settembre)
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

  // 2. Query per contare quanti contatti ci sono stati nel mese corrente
  const currentMonthCount = await db.emailContact.count({
    where: {
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd, // fino ad oggi
      },
    },
  });

  // 3. Query per contare quanti contatti ci sono stati nel mese scorso
  const lastMonthCount = await db.emailContact.count({
    where: {
      createdAt: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
    },
  });

  // 4. Calcolo del numero e percentuale di crescita
  const absoluteGrowth = currentMonthCount - lastMonthCount;
  const percentageGrowth =
    lastMonthCount === 0 ? 100 : (absoluteGrowth / lastMonthCount) * 100;

  return {
    currentMonthCount,
    lastMonthCount,
    absoluteGrowth,
    percentageGrowth: Math.round(percentageGrowth * 100) / 100, // Arrotondamento a 2 decimali
  };
}
