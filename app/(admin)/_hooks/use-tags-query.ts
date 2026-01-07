import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Tag } from "@/prisma/generated/client";

const fetchTags = async () => {
  const response = await axios.get("/api/admin/tags");

  return response.data as Tag[];
};

export const useTagssQuery = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tags"], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchTags(), // Funzione fetch
    enabled: true,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
