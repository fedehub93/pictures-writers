import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

// Hook to fetch all forms using suspense
export const useSuspenseForms = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.forms.getMany.queryOptions());
};

// Hook to fetch a form using suspense
export const useSuspenseForm = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.forms.getOne.queryOptions({ id }));
};
