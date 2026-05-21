// src/hooks/use-ebook-stats-query.ts

import { useQuery } from "@tanstack/react-query";
import { startOfMonth, endOfMonth } from "date-fns"; // Per gestire date di default
import axios from "axios";

import { useDateRangeStore } from "@/app/(admin)/_hooks/use-date-range-store";
import { GrowthStats } from "@/data/email-contact";

// Funzione fetcher per chiamare l'API con Axios
const fetchEbookDownloadGrowth = async (
  from: string,
  to: string
): Promise<GrowthStats> => {
  const response = await axios.get("/api/ebooks/stats", {
    params: { from, to },
  });

  return response.data;
};

// Hook personalizzato per gestire la query
export const useEbookStatsQuery = () => {
  const { dateRange } = useDateRangeStore();

  // Definire un intervallo di date di default se `dateRange` non è ancora disponibile
  const defaultFrom = startOfMonth(new Date()).toISOString();
  const defaultTo = endOfMonth(new Date()).toISOString();

  // Utilizziamo il fallback per le date se `dateRange` è undefined
  const from = dateRange?.from
    ? new Date(dateRange.from).toISOString()
    : defaultFrom;
  const to = dateRange?.to ? new Date(dateRange.to).toISOString() : defaultTo;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ebookDownloadGrowth", from, to], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchEbookDownloadGrowth(from, to), // Funzione fetch
    enabled: !!from && !!to, // Attiva la query solo se `from` e `to` sono definiti
  });

  return {
    data,
    isLoading,
    isError,
  };
};
