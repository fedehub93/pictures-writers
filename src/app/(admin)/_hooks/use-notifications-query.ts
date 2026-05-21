import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

export const useNotificationsQuery = (userId: string) => {
  const fetchNotifications = async ({ pageParam = undefined }) => {
    const paramsObj = { cursor: pageParam };
    const res = await axios.get(`/api/users/${userId}/notifications`, {
      params: pageParam ? { cursor: pageParam } : {},
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
