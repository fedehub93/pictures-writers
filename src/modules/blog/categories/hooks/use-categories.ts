import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";
import { useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

type Input = inferInput<typeof trpc.categories.getMany>;

// Hook to fetch all categories using suspense
export const useSuspenseCategories = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.categories.getMany.queryOptions({ ...params }));
};

// Hook to fetch a category using suspense
export const useSuspenseCategory = (rootId: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(
    trpc.categories.getLastByRootId.queryOptions({ rootId }),
  );
};
