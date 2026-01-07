import axios from "axios";
import { Form } from "@/prisma/generated/client";
import { useQuery } from "@tanstack/react-query";

const fetchForms = async () => {
  const response = await axios.get("/api/admin/forms");

  return response.data as Form[];
};

export const useFormsQuery = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["forms"], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchForms(), // Funzione fetch
    enabled: true,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
