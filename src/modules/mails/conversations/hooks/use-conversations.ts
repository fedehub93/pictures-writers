import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { type ConversationView } from "../schemas";

export const useConversations = (
  emailAccountId?: string,
  view: ConversationView = "inbox",
) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.conversations.getMany.queryOptions(
      { emailAccountId: emailAccountId ?? "", view },
      { enabled: Boolean(emailAccountId) },
    ),
  );
};

export const useConversation = (id?: string) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.conversations.getOne.queryOptions(
      { id: id ?? "" },
      {
        enabled: Boolean(id),
        // An open conversation polls so a reply that arrives while it is
        // visible can be marked read without a reload.
        refetchInterval: 30_000,
      },
    ),
  );
};
