import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";
import { useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

type Input = inferInput<typeof trpc.forms.getMany>;

// Hook to fetch all forms using suspense
export const useSuspenseForms = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.forms.getMany.queryOptions({ ...params }));
};

// Hook to fetch a form using suspense
export const useSuspenseForm = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.forms.getOne.queryOptions({ id }));
};
