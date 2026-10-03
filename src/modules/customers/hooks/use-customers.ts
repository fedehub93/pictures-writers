import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";
import { useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

type Input = inferInput<typeof trpc.customers.getMany>;

// Hook to fetch a paginated list of customers using suspense
export const useSuspenseCustomers = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.customers.getMany.queryOptions({ ...params }));
};

// Hook to fetch a single customer with its orders using suspense
export const useSuspenseCustomer = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.customers.getOne.queryOptions({ id }));
};
