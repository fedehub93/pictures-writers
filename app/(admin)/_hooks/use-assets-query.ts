import { useInfiniteQuery } from "@tanstack/react-query";
import qs from "query-string";

export const useAssetsQuery = (s = "") => {
  const fetchAssets = async ({ pageParam = undefined, s = "" }) => {
    const url = qs.stringifyUrl(
      {
        url: `/api/media`,
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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      initialPageParam: undefined,
      queryKey: ["assets", s],
      queryFn: ({ pageParam }) => fetchAssets({ pageParam, s }),
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      refetchInterval: false,
    });

  return { data, fetchNextPage, hasNextPage, isFetchingNextPage, status };
};
