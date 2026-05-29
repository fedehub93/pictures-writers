import { startOfMonth, endOfMonth } from "date-fns";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

import { useDateRangeStore } from "@/shared/hooks/use-date-range-store";

export const useSubscriptionStatsQuery = () => {
  const trpc = useTRPC();
  const { dateRange } = useDateRangeStore();

  // 1. Intervallo di date di default (fallback)
  const defaultFrom = startOfMonth(new Date()).toISOString();
  const defaultTo = endOfMonth(new Date()).toISOString();

  // 2. Calcolo dei parametri 'from' e 'to' sempre in formato ISO String
  const from = dateRange?.from
    ? new Date(dateRange.from).toISOString()
    : defaultFrom;
  const to = dateRange?.to ? new Date(dateRange.to).toISOString() : defaultTo;

  // 3. Eseguiamo la query usando TanStack Query + tRPC options
  // (Sostituisci '.analytics.' con il nome del tuo router se diverso)
  const { data, isLoading, isError } = useQuery({
    ...trpc.contacts.getContactsGrowth.queryOptions({
      from,
      to,
    }),
    enabled: !!from && !!to,
    refetchOnMount: true,
    staleTime: 0,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
