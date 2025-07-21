import axios from "axios";

import { useInfiniteQuery } from "@tanstack/react-query";

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
    const paramsObj = { cursor: pageParam, s };
    const res = await axios.get(`/api/posts`, {
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
