import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ContactsGetManyInput } from "../types";

// Hook to fetch all contacts using suspense
export const useSuspenseContacts = (params: ContactsGetManyInput) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.contacts.getMany.queryOptions(params));
};
