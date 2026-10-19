import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type ConversationsGetMany =
  inferRouterOutputs<AppRouter>["conversations"]["getMany"];

export type ConversationListItem = ConversationsGetMany[number];

export type ConversationGetOne =
  inferRouterOutputs<AppRouter>["conversations"]["getOne"];

export type EmailMessageGetOne = ConversationGetOne["messages"][number];

export type EmailAttachmentGetOne = EmailMessageGetOne["attachments"][number];
