import axios from "axios";
import { useInfiniteQuery } from "@tanstack/react-query";

import { API_ADMIN_PRODUCTS } from "@/constants/api";

export const useProductsQuery = (s = "", windowIsOpen = false) => {
  const fetchProducts = async ({ pageParam = undefined, s = "" }) => {
    const paramsObj = { cursor: pageParam, s };
    const res = await axios.get(API_ADMIN_PRODUCTS, {
      params: { ...paramsObj },
    });
    return res.data;
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: ["products", s],
    queryFn: ({ pageParam }) => fetchProducts({ pageParam, s }),
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    refetchInterval: false,
    enabled: windowIsOpen,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  };
};
