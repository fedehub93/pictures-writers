import { useInfiniteQuery } from "@tanstack/react-query";
import qs from "query-string";

export const useAssetsQuery = () => {
  const fetchAssets = async ({ pageParam = undefined }) => {
    const url = qs.stringifyUrl(
      {
        url: `/api/media`,
        query: {
          cursor: pageParam,
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
      queryKey: ["assets"],
      queryFn: fetchAssets,
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      refetchInterval: false,
    });

  return { data, fetchNextPage, hasNextPage, isFetchingNextPage, status };
};
