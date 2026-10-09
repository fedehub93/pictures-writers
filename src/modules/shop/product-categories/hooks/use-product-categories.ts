import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";

import { DEFAULT_PAGE, MAX_PAGE_SIZE } from "../constants";

type Input = inferInput<typeof trpc.productCategories.getMany>;

// Hook to fetch the paginated product category list using suspense
export const useSuspenseProductCategories = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(
    trpc.productCategories.getMany.queryOptions({ ...params }),
  );
};

// Hook to fetch a single product category using suspense
export const useSuspenseProductCategory = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(
    trpc.productCategories.getOne.queryOptions({ id }),
  );
};

// Hook used by selects to fetch the categories
export const useProductCategoriesQuery = () => {
  const trpc = useTRPC();

  const { data, isLoading, isError } = useQuery({
    ...trpc.productCategories.getMany.queryOptions({
      page: DEFAULT_PAGE,
      pageSize: MAX_PAGE_SIZE,
    }),
    enabled: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  return {
    data: data?.items,
    isLoading,
    isError,
  };
};
