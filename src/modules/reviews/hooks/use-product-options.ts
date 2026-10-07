import { useQuery } from "@tanstack/react-query";

import { ContentStatus } from "@/generated/prisma";

import { useTRPC } from "@/trpc/client";

export const useProductOptions = (s?: string) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.products.getMany.queryOptions({
      page: 1,
      pageSize: 100,
      search: s ?? null,
      status: ContentStatus.PUBLISHED,
    }),
  );
};
