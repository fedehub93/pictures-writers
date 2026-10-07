import { useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.products.getMany>;

// Hook to fetch the paginated product list using suspense
export const useSuspenseProducts = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.products.getMany.queryOptions({ ...params }));
};

// Hook to fetch the most recent version of a product using suspense
export const useSuspenseProduct = (rootId: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(
    trpc.products.getLastByRootId.queryOptions({ rootId }),
  );
};
