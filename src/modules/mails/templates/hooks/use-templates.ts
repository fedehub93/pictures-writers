import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

// Hook to fetch all templates using suspense
export const useSuspenseTemplates = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.templates.getMany.queryOptions());
};

// Hook to fetch a single template using suspense
export const useSuspenseTemplate = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.templates.getOne.queryOptions({ id }));
};
