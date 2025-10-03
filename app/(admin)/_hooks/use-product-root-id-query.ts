import axios from "axios";
import { Product } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { GetPublishedProductByRootId } from "@/data/product";

const fetchProductByRootId = async (rootId: string) => {
  const response = await axios.get(`/api/admin/shop/products/${rootId}`);

  return response.data as GetPublishedProductByRootId;
};

export const useProductRootIdQuery = (rootId: string) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["product-by-root-id"], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchProductByRootId(rootId), // Funzione fetch
    enabled: true,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
