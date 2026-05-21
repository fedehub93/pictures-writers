import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { GetPublishedProductByRootId } from "@/data/product";

const fetchProductByRootId = async (rootId?: string | null) => {
  if (!rootId) return null;

  const response = await axios.get(`/api/admin/shop/products/${rootId}`);

  return response.data as GetPublishedProductByRootId;
};

export const useProductRootIdQuery = ({
  rootId,
  enabled = true,
}: {
  rootId?: string | null;
  enabled?: boolean;
}) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [`product-${rootId}`], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchProductByRootId(rootId), // Funzione fetch
    enabled,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
