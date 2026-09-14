import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

import { trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.roles.getMany>;

export const useSuspenseRoles = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.roles.getMany.queryOptions(params));
};

export const useRolesQuery = (params: Input) => {
  const trpc = useTRPC();

  return useQuery(trpc.roles.getMany.queryOptions(params));
};