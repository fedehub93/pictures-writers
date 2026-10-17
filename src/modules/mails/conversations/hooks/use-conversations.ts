import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

export const useConversations = (emailAccountId?: string) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.conversations.getMany.queryOptions(
      { emailAccountId: emailAccountId ?? "" },
      { enabled: Boolean(emailAccountId) },
    ),
  );
};

export const useConversation = (id?: string) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.conversations.getOne.queryOptions(
      { id: id ?? "" },
      { enabled: Boolean(id) },
    ),
  );
};
