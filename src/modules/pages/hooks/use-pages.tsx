import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";
import { useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

type Input = inferInput<typeof trpc.pages.getMany>;

// Hook to fetch all pages using suspense
export const useSuspensePages = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.pages.getMany.queryOptions({ ...params }));
};

// Hook to fetch a page using suspense
export const useSuspensePage = (rootId: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.pages.getLastByRootId.queryOptions({ rootId }));
};
