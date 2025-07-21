import axios from "axios";

import { User } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

export const useAuthorsQuery = () => {
  const fetchAuthors = async () => {
    const res = await axios.get(`/api/admin/authors`);
    return res.data;
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
