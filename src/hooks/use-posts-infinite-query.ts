import axios from "axios";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { GetPaginatedPosts } from "@/data/post";

type UsePostsInfiniteQueryProps = {
  s: string;
  minChar?: boolean;
  windowIsOpen?: boolean;
};

export const usePostsInfiniteQuery = ({
  s,
  minChar = true,
  windowIsOpen = false,
}: UsePostsInfiniteQueryProps) => {
  // ✅ Nota bene: pageParam è unknown perché React Query lo fornisce così
  const fetchPosts = async ({
    pageParam,
  }: {
    pageParam?: unknown;
  }): Promise<GetPaginatedPosts> => {
    const cursor = (pageParam as string | null | undefined) ?? undefined;

    if (!s && minChar) {
      return {
        posts: [],
        pagination: {
          page: 1,
          perPage: 0,
          totalRecords: 0,
          totalPages: 0,
        },
        nextCursor: null,
      };
    }

    const params = { cursor, s };
    const { data } = await axios.get<GetPaginatedPosts>("/api/posts", { params });

    return data;
  };

  const query = useInfiniteQuery<GetPaginatedPosts, Error>({
    queryKey: ["posts", s],
    queryFn: ({ pageParam }) => fetchPosts({ pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    refetchInterval: false,
    enabled: windowIsOpen,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    status: query.status,
    refetch: query.refetch,
  };
};
