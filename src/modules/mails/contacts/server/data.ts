import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";

import { db } from "@/shared/lib/db";

import { GrowthStats } from "../types";

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

export async function getEmailContactsGrowth(
  from?: Date,
  to?: Date,
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
