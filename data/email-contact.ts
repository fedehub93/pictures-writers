import { db } from "@/lib/db";
import { endOfDay, startOfDay, subMonths } from "date-fns";

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

export interface GrowthStats {
  currentMonthCount: number;
  lastMonthCount: number;
  absoluteGrowth: number;
  percentageGrowth: number;
}

export async function getEbookDownloadGrowth(
  from?: Date,
  to?: Date
): Promise<GrowthStats> {
  // Se il range di date non è definito, ritorniamo valori di default
  if (!from || !to) {
    throw new Error("Date range is required");
  }

  // Otteniamo l'inizio e la fine del range selezionato dall'utente
  const rangeStart = startOfDay(from);
  const rangeEnd = endOfDay(to);

  // 1. Query per contare quanti download di ebook ci sono stati nel range selezionato
  const currentRangeCount = await db.emailContactInteraction.count({
    where: {
      interactionType: "ebook_downloaded",
      interactionDate: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
  });

  // 2. Query per contare quanti download di ebook ci sono stati nello stesso range del mese scorso
  const previousRangeStart = startOfDay(subMonths(from, 1));
  const previousRangeEnd = endOfDay(subMonths(to, 1));

  const lastRangeCount = await db.emailContactInteraction.count({
    where: {
      interactionType: "ebook_downloaded",
      interactionDate: {
        gte: previousRangeStart,
        lte: previousRangeEnd,
      },
    },
  });
  // 3. Calcolo del numero e percentuale di crescita
  const absoluteGrowth = currentRangeCount - lastRangeCount;
  const percentageGrowth =
    lastRangeCount === 0 ? 100 : (absoluteGrowth / lastRangeCount) * 100;

  return {
    currentMonthCount: currentRangeCount,
    lastMonthCount: lastRangeCount,
    absoluteGrowth,
    percentageGrowth: Math.round(percentageGrowth * 100) / 100, // Arrotondamento a 2 decimali
  };
}

export async function getEmailContactGrowth(
  from?: Date,
  to?: Date
): Promise<GrowthStats> {
  // Se il range di date non è definito, ritorniamo valori di default
  if (!from || !to) {
    throw new Error("Date range is required");
  }

  // Otteniamo l'inizio e la fine del range selezionato dall'utente
  const rangeStart = startOfDay(from);
  const rangeEnd = endOfDay(to);

  // 2. Query per contare quanti contatti ci sono stati nel mese corrente
  const currentRangeCount = await db.emailContact.count({
    where: {
      createdAt: {
        gte: rangeStart,
        lte: rangeEnd, // fino ad oggi
      },
    },
  });

  // 2. Query per contare quanti download di ebook ci sono stati nello stesso range del mese scorso
  const previousRangeStart = startOfDay(subMonths(from, 1));
  const previousRangeEnd = endOfDay(subMonths(to, 1));

  // 3. Query per contare quanti contatti ci sono stati nel mese scorso
  const lastRangeCount = await db.emailContact.count({
    where: {
      createdAt: {
        gte: previousRangeStart,
        lte: previousRangeEnd,
      },
    },
  });

  // 3. Calcolo del numero e percentuale di crescita
  const absoluteGrowth = currentRangeCount - lastRangeCount;
  const percentageGrowth =
    lastRangeCount === 0 ? 100 : (absoluteGrowth / lastRangeCount) * 100;

  return {
    currentMonthCount: currentRangeCount,
    lastMonthCount: lastRangeCount,
    absoluteGrowth,
    percentageGrowth: Math.round(percentageGrowth * 100) / 100, // Arrotondamento a 2 decimali
  };
}
