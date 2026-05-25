import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

// Hook to fetch all workflows using suspense
export const useSuspenseSingleSends = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.singleSends.getMany.queryOptions());
};

// Hook to fetch a single single send using suspense
export const useSuspenseSingleSend = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.singleSends.getOne.queryOptions({ id }));
};
