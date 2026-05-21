import axios from "axios";

import { useInfiniteQuery } from "@tanstack/react-query";

export const useAssetsQuery = (s = "", windowIsOpen = false) => {
  const fetchAssets = async ({ pageParam = undefined, s = "" }) => {
    const paramsObj = { cursor: pageParam, s };
    const res = await axios.get(`/api/media`, { params: { ...paramsObj } });
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
    queryKey: ["assets", s],
    queryFn: ({ pageParam }) => fetchAssets({ pageParam, s }),
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
