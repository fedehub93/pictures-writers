import axios from "axios";
import { Organization } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

const fetchOrganizations = async () => {
  const response = await axios.get("/api/admin/organizations");
  return response.data as Organization[];
};

export const useOrganizationsQuery = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["organizations"], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchOrganizations(), // Funzione fetch
    enabled: true,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
