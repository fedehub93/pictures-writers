import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";
import { useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

type Input = inferInput<typeof trpc.tags.getMany>;

// Hook to fetch all tags using suspense
export const useSuspenseTags = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.tags.getMany.queryOptions({ ...params }));
};

// Hook to fetch a tag using suspense
export const useSuspenseTag = (rootId: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.tags.getLastByRootId.queryOptions({ rootId }));
};
