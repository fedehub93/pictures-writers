import { inferInput } from "@trpc/tanstack-react-query";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.orders.getMany>;

// Hook to fetch a paginated list of orders using suspense
export const useSuspenseOrders = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.orders.getMany.queryOptions({ ...params }));
};

// Hook to fetch a single order with its relations using suspense
export const useSuspenseOrder = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.orders.getOne.queryOptions({ id }));
};
