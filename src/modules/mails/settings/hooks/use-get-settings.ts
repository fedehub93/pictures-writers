import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

// Hook to fetch settings using suspense
export const useSuspenseSettings = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.mailSettings.get.queryOptions());
};
