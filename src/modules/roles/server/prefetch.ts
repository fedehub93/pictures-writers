import { inferInput } from "@trpc/tanstack-react-query";

import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.roles.getMany>;

export const prefetchRoles = (params: Input) => {
  return prefetch(trpc.roles.getMany.queryOptions({ ...params }));
};