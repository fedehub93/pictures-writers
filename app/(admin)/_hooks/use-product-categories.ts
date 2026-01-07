import axios from "axios";
import { Category } from "@/prisma/generated/client";
import { useQuery } from "@tanstack/react-query";

const fetchProductCategories = async () => {
  const response = await axios.get("/api/admin/shop/categories");

  return response.data as Category[];
};

export const useProductCategoriesQuery = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["product-categories"], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchProductCategories(), // Funzione fetch
    enabled: true,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
