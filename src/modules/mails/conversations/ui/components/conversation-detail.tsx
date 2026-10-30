"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, MailOpenIcon, ReplyIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Skeleton } from "@/shared/ui/skeleton";

import {
  initialExpandedMessageIds,
  isConversationMessageExpanded,
  shouldCollapseEarlierMessages,
  toggleExpandedMessage,
} from "../../lib/message-expansion";
import { isNearThreadBottom } from "../../lib/thread-scroll";
import { type ConversationGetOne } from "../../types";
import { MessageItem } from "./message-item";
import { StarBadge } from "./star-badge";

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Whether the thread should keep following its newest message. Reading an
  // older part of a conversation is never interrupted by a new arrival.
  const followsNewest = useRef(true);

  // Expansion is local to the open conversation. A conversation with more than
  // two messages opens with only the newest expanded.
  const [expansion, setExpansion] = useState<{
    conversationId?: string;
    expandedIds: Set<string>;
  }>({ expandedIds: new Set() });

  const conversationId = conversation?.id;
  const messageCount = conversation?.messages.length ?? 0;

  const scrollToNewest = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTop = viewport.scrollHeight;
  }, []);

  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    followsNewest.current = isNearThreadBottom({
      scrollTop: viewport.scrollTop,
      clientHeight: viewport.clientHeight,
      scrollHeight: viewport.scrollHeight,
    });
  };

  // Land on the newest message when a conversation opens.
  useEffect(() => {
    if (!conversationId) return;

    followsNewest.current = true;
    scrollToNewest();

    const frame = window.requestAnimationFrame(scrollToNewest);

    return () => window.cancelAnimationFrame(frame);
  }, [conversationId, scrollToNewest]);

  // Follow new messages only while the reader was already at the bottom.
  useEffect(() => {
    if (!conversationId || !followsNewest.current) return;

    scrollToNewest();
  }, [conversationId, messageCount, scrollToNewest]);

  // The thread re-anchors to its newest message while the reader is following
  // it. Both the content and the viewport are observed: message frames report
  // their height as they measure, and the viewport changes when the reply
  // composer grows, which must not push the message being answered out of view.
  useEffect(() => {
    const content = contentRef.current;
    const viewport = viewportRef.current;
    if (!content || !viewport || typeof ResizeObserver !== "function") return;

    const observer = new ResizeObserver(() => {
      if (followsNewest.current) scrollToNewest();
    });

    observer.observe(content);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [conversationId, scrollToNewest]);

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
    // Opening an earlier message is a deliberate move away from the newest one.
    followsNewest.current = false;

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
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
      <header className="flex items-start gap-3 border-b px-4 py-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          // Visible exactly when the conversation list is not beside the thread.
          className="hidden shrink-0 one-pane:inline-flex"
          onClick={onBack}
          aria-label="Back to inbox"
        >
          <ArrowLeftIcon />
        </Button>
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="flex min-w-0 items-center gap-2 text-lg leading-tight font-semibold">
            {conversation.isStarred && <StarBadge className="size-4" />}
            <span className="truncate">{subject}</span>
          </h2>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {messageCount} {messageCount === 1 ? "message" : "messages"} ·{" "}
            {contactLabel}
          </p>
        </div>
        {actionsSlot && <div className="shrink-0">{actionsSlot}</div>}
      </header>

      <div
        ref={viewportRef}
        onScroll={handleScroll}
        // Any deliberate interaction inside the thread (expanding a message,
        // revealing images) means the reader is no longer waiting for the
        // thread to settle, so following the newest message stops.
        onPointerDown={() => {
          followsNewest.current = false;
        }}
        tabIndex={0}
        role="region"
        aria-label="Message thread"
        className="mail-thread-scroll min-h-0 flex-1 overflow-y-auto focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <div ref={contentRef} className="flex flex-col">
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
        </div>
      </div>

      {replySlot ??
        (onReply ? (
          <div className="border-t p-3">
            <button
              type="button"
              onClick={onReply}
              className="flex w-full items-center gap-2 overflow-hidden rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ReplyIcon className="size-4 shrink-0" />
              <span className="min-w-0 truncate">
                Reply to {conversation.contactName ?? conversation.contactEmail}…
              </span>
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
