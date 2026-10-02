import { inferInput } from "@trpc/tanstack-react-query";

import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.orders.getMany>;

/**
 * Prefetch the paginated order list.
 */
export const prefetchOrders = (params: Input) => {
  return prefetch(trpc.orders.getMany.queryOptions({ ...params }));
};

/**
 * Prefetch a single order with its customer, items and payments.
 */
export const prefetchOrderById = (id: string) => {
  return prefetch(trpc.orders.getOne.queryOptions({ id }));
};
