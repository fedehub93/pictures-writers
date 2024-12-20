import { useInfiniteQuery } from "@tanstack/react-query";
import qs from "query-string";

type UsePostsQuery = {
  s: string;
  minChar?: boolean;
  windowIsOpen?: boolean;
};

export const usePostsQuery = ({
  s,
  minChar = true,
  windowIsOpen = false,
}: UsePostsQuery) => {
  const fetchPosts = async ({ pageParam = undefined, s = "" }) => {
    if (!s && minChar === true) return { items: [] };
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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: ["posts", s],
    queryFn: ({ pageParam }) => fetchPosts({ pageParam, s }),
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
