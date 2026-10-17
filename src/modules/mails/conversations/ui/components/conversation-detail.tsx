"use client";

import { ArrowLeftIcon, MailOpenIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Skeleton } from "@/shared/ui/skeleton";

import { type ConversationGetOne } from "../../types";
import { MessageItem } from "./message-item";

interface ConversationDetailProps {
  conversation?: ConversationGetOne;
  isLoading: boolean;
  onBack: () => void;
}

export const ConversationDetail = ({
  conversation,
  isLoading,
  onBack,
}: ConversationDetailProps) => {
  if (isLoading) {
    return <ConversationDetailSkeleton />;
  }

  if (!conversation) {
    return (
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MailOpenIcon />
          </EmptyMedia>
          <EmptyTitle>No conversation selected</EmptyTitle>
          <EmptyDescription>
            Pick a conversation from the list to read the full thread.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const subject =
    conversation.messages.find((message) => message.subject)?.subject ??
    "(No subject)";

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
          aria-label="Back to inbox"
        >
          <ArrowLeftIcon />
        </Button>
        <div className="flex min-w-0 flex-col">
          <h2 className="truncate text-base font-semibold">{subject}</h2>
          <span className="truncate text-xs text-muted-foreground">
            {conversation.contactName
              ? `${conversation.contactName} · ${conversation.contactEmail}`
              : conversation.contactEmail}
          </span>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4 md:p-6">
          {conversation.messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

const ConversationDetailSkeleton = () => {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex flex-col gap-2 border-b px-4 py-3 md:px-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
};
