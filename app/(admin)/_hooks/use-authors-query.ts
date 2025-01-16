import { User } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import qs from "query-string";

export const useAuthorsQuery = () => {
  const fetchAuthors = async () => {
    const url = qs.stringifyUrl(
      {
        url: `/api/admin/authors`,
      },
      { skipNull: true }
    );
    const res = await fetch(url);
    return res.json();
  };

  const { data, isLoading, isFetching, isError, refetch } = useQuery<User[]>({
    queryKey: ["authors"], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchAuthors(), // Funzione fetch
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
