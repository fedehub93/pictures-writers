import { useInfiniteQuery } from "@tanstack/react-query";
import qs from "query-string";

export const usePostsQuery = (s = "") => {
  const fetchPosts = async ({ pageParam = undefined, s = "" }) => {
    if (!s) return { items: [] };
    const url = qs.stringifyUrl(
      {
        url: `/api/posts`,
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
      queryKey: ["posts", s],
      queryFn: ({ pageParam }) => fetchPosts({ pageParam, s }),
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      refetchInterval: false,
    });

  return { data, fetchNextPage, hasNextPage, isFetchingNextPage, status };
};
