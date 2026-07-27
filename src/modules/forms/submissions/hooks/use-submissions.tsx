import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";
import { useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

type Input = inferInput<typeof trpc.submissions.getMany>;

// Hook to fetch all forms using suspense
export const useSuspenseFormSubmissions = (params: Input) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.submissions.getMany.queryOptions({ ...params }));
};

// Hook to fetch a form using suspense
export const useSuspenseFormSubmission = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.submissions.getOne.queryOptions({ id }));
};
