import { inferInput } from "@trpc/tanstack-react-query";

import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.customers.getMany>;

/**
 * Prefetch the paginated customer list.
 */
export const prefetchCustomers = (params: Input) => {
  return prefetch(trpc.customers.getMany.queryOptions({ ...params }));
};

/**
 * Prefetch a single customer with its orders.
 */
export const prefetchCustomerById = (id: string) => {
  return prefetch(trpc.customers.getOne.queryOptions({ id }));
};
