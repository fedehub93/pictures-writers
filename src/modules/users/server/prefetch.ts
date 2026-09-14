import { inferInput } from "@trpc/tanstack-react-query";

import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.users.getMany>;

export const prefetchUsers = (params: Input) => {
  return prefetch(trpc.users.getMany.queryOptions({ ...params }));
};