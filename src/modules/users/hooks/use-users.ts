import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

import { trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.users.getMany>;

export const useSuspenseUsers = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.users.getMany.queryOptions(params));
};

export const useUsersQuery = (params: Input) => {
  const trpc = useTRPC();

  return useQuery(trpc.users.getMany.queryOptions(params));
};
