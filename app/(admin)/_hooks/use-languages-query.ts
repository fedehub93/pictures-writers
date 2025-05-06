import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { EmailAudience } from "@prisma/client";

const fetchLanguages = async () => {
  const response = await axios.get("/api/admin/languages");

  return response.data as EmailAudience[];
};

export const useLanguagesQuery = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["languages"], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchLanguages(), // Funzione fetch
    enabled: true,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
