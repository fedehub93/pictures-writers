import axios from "axios";

import { Widget } from "@/prisma/generated/client";
import { useQuery } from "@tanstack/react-query";

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
    const paramsObj = { onlyActive };
    const res = await axios.get(`/api/admin/settings/socials`, {
      params: { ...paramsObj },
    });
    return res.data;
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
