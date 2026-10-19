import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

// Hook to fetch all email accounts using suspense
export const useSuspenseEmailAccounts = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.emailAccounts.getMany.queryOptions());
};
