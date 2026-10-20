"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, MailOpenIcon, ReplyIcon } from "lucide-react";

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

import {
  initialExpandedMessageIds,
  isConversationMessageExpanded,
  shouldCollapseEarlierMessages,
  toggleExpandedMessage,
} from "../../lib/message-expansion";
import { type ConversationGetOne } from "../../types";
import { MessageItem } from "./message-item";

interface ConversationDetailProps {
  conversation?: ConversationGetOne;
  isLoading: boolean;
  onBack: () => void;
  /** Opens the reply composer; the footer bar hides once it is open. */
  onReply?: () => void;
  /** Actions rendered in the header; kept out of this file's dependencies. */
  actionsSlot?: ReactNode;
  /** Composer rendered under the thread; kept out of this file's dependencies. */
  replySlot?: ReactNode;
}

export const ConversationDetail = ({
  conversation,
  isLoading,
  onBack,
  onReply,
  actionsSlot,
  replySlot,
}: ConversationDetailProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Expansion is local to the open conversation. A conversation with more than
  // two messages opens with only the newest expanded.
  const [expansion, setExpansion] = useState<{
    conversationId?: string;
    expandedIds: Set<string>;
  }>({ expandedIds: new Set() });

  const conversationId = conversation?.id;
  const messageCount = conversation?.messages.length ?? 0;

  // Land on the newest message when a conversation opens, and keep following
  // it as new messages arrive.
  useEffect(() => {
    if (!conversationId) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [conversationId, messageCount]);

  if (isLoading) {
    return <ConversationDetailSkeleton />;
  }

  if (!conversation) {
    return (
      <div className="flex h-full min-h-0 w-full items-center justify-center rounded-xl border bg-background">
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
      </div>
    );
  }

  const subject =
    conversation.messages.find((message) => message.subject)?.subject ??
    "(No subject)";
  const contactLabel = conversation.contactName
    ? `${conversation.contactName} · ${conversation.contactEmail}`
    : conversation.contactEmail;

  const expandedIds =
    expansion.conversationId === conversation.id
      ? expansion.expandedIds
      : initialExpandedMessageIds(conversation.messages.map(({ id }) => id));

  const toggleMessage = (messageId: string) => {
    setExpansion((current) => {
      const base =
        current.conversationId === conversation.id
          ? current.expandedIds
          : initialExpandedMessageIds(conversation.messages.map(({ id }) => id));

      return {
        conversationId: conversation.id,
        expandedIds: toggleExpandedMessage(base, messageId),
      };
    });
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
      <header className="flex items-start gap-3 border-b px-4 py-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={onBack}
          aria-label="Back to inbox"
        >
          <ArrowLeftIcon />
        </Button>
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-lg leading-tight font-semibold">
            {subject}
          </h2>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {messageCount} {messageCount === 1 ? "message" : "messages"} ·{" "}
            {contactLabel}
          </p>
        </div>
        {actionsSlot && <div className="shrink-0">{actionsSlot}</div>}
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col">
          {conversation.messages.map((message, index) => {
            const expanded = isConversationMessageExpanded({
              messageId: message.id,
              index,
              messageCount: conversation.messages.length,
              expandedIds,
            });

            // Only earlier messages are collapsible; the newest stays open and
            // its header is not a dead toggle.
            const collapsible =
              shouldCollapseEarlierMessages(conversation.messages.length) &&
              index < conversation.messages.length - 1;

            return (
              <MessageItem
                key={message.id}
                message={message}
                collapsed={!expanded}
                onToggle={
                  collapsible ? () => toggleMessage(message.id) : undefined
                }
              />
            );
          })}
          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </ScrollArea>

      {replySlot ??
        (onReply ? (
          <div className="border-t p-3">
            <button
              type="button"
              onClick={onReply}
              className="flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ReplyIcon className="size-4" />
              Reply to {conversation.contactName ?? conversation.contactEmail}…
            </button>
          </div>
        ) : null)}
    </div>
  );
};

const ConversationDetailSkeleton = () => {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border bg-background">
      <div className="flex flex-col gap-2 border-b px-4 py-4 md:px-6">
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
