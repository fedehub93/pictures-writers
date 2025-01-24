import { Widget } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import qs from "query-string";

type UseSocialSettingsQuery = {
  onlyActive: boolean;
};

export const useSocialSettingsQuery = ({
  onlyActive,
}: {
  onlyActive?: boolean;
}) => {
  const fetchSocials = async ({
    onlyActive = false,
  }: UseSocialSettingsQuery) => {
    const url = qs.stringifyUrl(
      {
        url: `/api/admin/settings/socials`,
        query: { onlyActive },
      },
      { skipNull: true }
    );
    const res = await fetch(url);
    return res.json();
  };

  const { data, isLoading, isFetching, isError, refetch } = useQuery<Widget[]>({
    queryKey: ["socials"], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchSocials({ onlyActive: onlyActive || false }), // Funzione fetch
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
