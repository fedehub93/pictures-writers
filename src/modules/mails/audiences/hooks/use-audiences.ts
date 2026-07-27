import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

// Hook to fetch all audiences using suspense
export const useSuspenseAudiences = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.audiences.getMany.queryOptions());
};

// Hook to fetch a audience using suspense
export const useSuspenseAudience = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.audiences.getOne.queryOptions({ id }));
};
