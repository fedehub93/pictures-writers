import { db } from "@/lib/db";
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";

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
  chartData?: any;
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

  // 4. Chart Data
  const chartData = await getEbookDownloadChartData();

  return {
    currentMonthCount: currentRangeCount,
    lastMonthCount: lastRangeCount,
    absoluteGrowth,
    percentageGrowth: Math.round(percentageGrowth * 100) / 100, // Arrotondamento a 2 decimali
    chartData,
  };
}

const getEbookDownloadChartData = async () => {
  const today = new Date();
  const startDate = startOfMonth(subMonths(today, 6)); // 7 mesi fa e poi il primo giorno del mese
  const endDate = endOfMonth(subMonths(today, 1)); // Ultimo giorno del mese scorso

  const interactions = await db.emailContactInteraction.findMany({
    where: {
      interactionDate: {
        gte: startDate,
        lt: endDate, // Escludi il mese corrente
      },
      interactionType: "ebook_downloaded", // Puoi cambiarlo in base al tipo di interazione che ti interessa
    },
  });

  // Raggruppa i dati per mese e anno
  const groupedData: { [key: string]: number } = {};

  interactions.forEach((interaction) => {
    const interactionDate = new Date(interaction.interactionDate);
    const month = interactionDate.getMonth(); // 0-based (gennaio = 0, febbraio = 1, ...)
    const year = interactionDate.getFullYear();

    const monthYearKey = `${year}-${month + 1}`; // Formato 'YYYY-MM'

    if (!groupedData[monthYearKey]) {
      groupedData[monthYearKey] = 0;
    }

    groupedData[monthYearKey] += 1; // Conta le interazioni per quel mese
  });

  // Organizza i dati nel formato richiesto
  const chartData = [];
  let month = startDate.getMonth();
  let year = startDate.getFullYear();

  // Mappa i risultati nel formato { month: "January", download: 186 }
  for (let i = 0; i < 6; i++) {
    const monthName = new Date(year, month).toLocaleString("default", {
      month: "long",
    });
    const monthYearKey = `${year}-${month + 1}`;
    const downloads = groupedData[monthYearKey] || 0;

    chartData.push({
      month: monthName,
      download: downloads,
    });

    // Passa al mese successivo
    month = (month + 1) % 12;
    if (month === 0) year += 1; // Se superi dicembre, aumenta l'anno
  }

  return chartData;
};

const getEmailContactsChartData = async () => {
  const today = new Date();
  const startDate = startOfMonth(subMonths(today, 6)); // 7 mesi fa e poi il primo giorno del mese
  const endDate = endOfMonth(subMonths(today, 1)); // Ultimo giorno del mese scorso

  const contacts = await db.emailContact.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
  });

  // Raggruppa i dati per mese e anno
  const groupedData: { [key: string]: number } = {};

  contacts.forEach((contact) => {
    const contactDate = new Date(contact.createdAt);
    const month = contactDate.getMonth(); // 0-based (gennaio = 0, febbraio = 1, ...)
    const year = contactDate.getFullYear();

    const monthYearKey = `${year}-${month + 1}`; // Formato 'YYYY-MM'

    if (!groupedData[monthYearKey]) {
      groupedData[monthYearKey] = 0;
    }

    groupedData[monthYearKey] += 1; // Conta le interazioni per quel mese
  });

  // Organizza i dati nel formato richiesto
  const chartData = [];
  let month = startDate.getMonth();
  let year = startDate.getFullYear();

  // Mappa i risultati nel formato { month: "January", download: 186 }
  for (let i = 0; i < 6; i++) {
    const monthName = new Date(year, month).toLocaleString("default", {
      month: "long",
    });
    const monthYearKey = `${year}-${month + 1}`;
    const downloads = groupedData[monthYearKey] || 0;

    chartData.push({
      month: monthName,
      download: downloads,
    });

    // Passa al mese successivo
    month = (month + 1) % 12;
    if (month === 0) year += 1; // Se superi dicembre, aumenta l'anno
  }

  return chartData;
};

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

  // 4. Chart Data
  const chartData = await getEmailContactsChartData();

  return {
    currentMonthCount: currentRangeCount,
    lastMonthCount: lastRangeCount,
    absoluteGrowth,
    percentageGrowth: Math.round(percentageGrowth * 100) / 100, // Arrotondamento a 2 decimali
    chartData,
  };
}
