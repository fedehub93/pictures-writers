import axios from "axios";

import { Widget, WidgetSection } from "@/prisma/generated/client";
import { useQuery } from "@tanstack/react-query";

type UseWidgetsQuery = {
  s?: string;
  section?: WidgetSection;
};

export const useWidgetsQuery = ({ s = "", section }: UseWidgetsQuery) => {
  const fetchWidgets = async ({ s = "", section }: UseWidgetsQuery) => {
    const paramsObj = { s, section };
    const res = await axios.get(`/api/admin/widgets`, {
      params: { ...paramsObj },
    });
    return res.data;
  };

  const { data, isLoading, isFetching, isError, refetch } = useQuery<Widget[]>({
    queryKey: ["widgets", s, section], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchWidgets({ s, section }), // Funzione fetch
    enabled: true,
  });

  return {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
};
