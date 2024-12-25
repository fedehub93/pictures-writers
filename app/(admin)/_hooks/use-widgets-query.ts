import { Widget, WidgetSection } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import qs from "query-string";

type UseWidgetsQuery = {
  s?: string;
  section?: WidgetSection;
};

export const useWidgetsQuery = ({ s = "", section }: UseWidgetsQuery) => {
  const fetchWidgets = async ({ s = "", section }: UseWidgetsQuery) => {
    const url = qs.stringifyUrl(
      {
        url: `/api/admin/widgets`,
        query: {
          s,
          section,
        },
      },
      { skipNull: true }
    );
    const res = await fetch(url);
    return res.json();
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
