import { useInfiniteQuery } from "@tanstack/react-query";

import { ContentStatus } from "@/generated/prisma";

import { DEFAULT_PAGE_SIZE } from "@/modules/shop/products/constants";

import { useTRPCClient } from "@/trpc/client";

export const useProductsQuery = (s = "", windowIsOpen = false) => {
  const client = useTRPCClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    initialPageParam: 1,
    queryKey: ["products", s],
    queryFn: ({ pageParam }) =>
      client.products.getMany.query({
        search: s,
        page: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
        status: ContentStatus.PUBLISHED,
      }),
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < lastPage.totalPages ? allPages.length + 1 : undefined,
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
