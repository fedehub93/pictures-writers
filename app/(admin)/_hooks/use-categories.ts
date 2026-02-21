import { Category } from "@/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchCategories = async () => {
  const response = await axios.get("/api/admin/categories");

  return response.data as Category[];
};

export const useCategoriesQuery = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchCategories(), // Funzione fetch
    enabled: true,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
