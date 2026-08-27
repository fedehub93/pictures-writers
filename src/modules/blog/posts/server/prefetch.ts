import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.posts.getMany>;

/**
 * Prefetch all Posts
 */
export const prefetchPosts = (params: Input) => {
  return prefetch(trpc.posts.getMany.queryOptions({ ...params }));
};

/**
 * Prefetch a single post
 */
export const prefetchPostById = (rootId: string) => {
  return prefetch(trpc.posts.getLastByRootId.queryOptions({ rootId }));
};
