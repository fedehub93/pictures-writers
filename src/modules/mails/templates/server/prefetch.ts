import { prefetch, trpc } from "@/trpc/server";

/**
 * Prefetch all Email Templates
 */
export const prefetchTemplates = () => {
  return prefetch(trpc.templates.getMany.queryOptions());
};

/**
 * Prefetch a single template
 */
export const prefetchTemplateById = (id: string) => {
  return prefetch(trpc.templates.getOne.queryOptions({ id }));
};
