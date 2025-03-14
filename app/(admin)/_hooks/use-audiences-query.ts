import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { EmailAudience } from "@prisma/client";

const fetchAudiences = async () => {
  const response = await axios.get("/api/admin/mails/audiences");

  return response.data as EmailAudience[];
};

export const useAudiencesQuery = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["audiences"], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchAudiences(), // Funzione fetch
    enabled: true,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
