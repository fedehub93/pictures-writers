"use client";

import { InboxIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Skeleton } from "@/shared/ui/skeleton";

import { type ConversationListItem as ConversationListItemType } from "../../types";
import { ConversationListItem } from "./conversation-list-item";

interface ConversationListProps {
  conversations: ConversationListItemType[];
  isLoading: boolean;
  selectedId?: string;
  onSelect?: (id: string) => void;
  showActions?: boolean;
  onMarkRead?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  onToggleStar?: (id: string, starred: boolean) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const ConversationList = ({
  conversations,
  isLoading,
  selectedId,
  onSelect,
  showActions = true,
  onMarkRead,
  onMarkUnread,
  onToggleStar,
  emptyTitle = "No conversations",
  emptyDescription = "Inbound and outbound messages for this account appear here.",
}: ConversationListProps) => {
  if (isLoading) {
    return <ConversationListSkeleton />;
  }

  if (conversations.length === 0) {
    return (
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col">
        {conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            isSelected={conversation.id === selectedId}
            onSelect={onSelect}
            showActions={showActions}
            onMarkRead={onMarkRead}
            onMarkUnread={onMarkUnread}
            onToggleStar={onToggleStar}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

const ConversationListSkeleton = () => {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 border-b px-4 py-3.5"
        >
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
};
