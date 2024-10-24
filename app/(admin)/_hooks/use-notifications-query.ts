import { useInfiniteQuery } from "@tanstack/react-query";
import qs from "query-string";

export const useNotificationsQuery = (userId: string) => {
  const fetchNotifications = async ({ pageParam = undefined }) => {
    const url = qs.stringifyUrl(
      {
        url: `/api/users/${userId}/notifications`,
        query: {
          cursor: pageParam,
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
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) => fetchNotifications({ pageParam }),
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    refetchInterval: 30000,
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
