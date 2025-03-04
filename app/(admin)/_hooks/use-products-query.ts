import { useInfiniteQuery } from "@tanstack/react-query";
import qs from "query-string";

export const useProductsQuery = (s = "", windowIsOpen = false) => {
  const fetchProducts = async ({ pageParam = undefined, s = "" }) => {
    const url = qs.stringifyUrl(
      {
        url: `/api/admin/products`,
        query: {
          cursor: pageParam,
          s,
        },
      },
      { skipNull: true }
    );
    const res = await fetch(url);
    return res.json();
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
