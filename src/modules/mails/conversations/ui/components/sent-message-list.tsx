"use client";

import { PaperclipIcon, SendIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Skeleton } from "@/shared/ui/skeleton";

import { formatRelativeTime } from "../../lib/format";
import { type SentMessageListItem } from "../../types";
import { ContactAvatar } from "./contact-avatar";

interface SentMessageListProps {
  messages: SentMessageListItem[];
  isLoading: boolean;
  onOpen: (conversationId: string) => void;
}

/** Sent is a list of outbound messages, not of conversations. */
export const SentMessageList = ({
  messages,
  isLoading,
  onOpen,
}: SentMessageListProps) => {
  if (isLoading) {
    return <SentMessageListSkeleton />;
  }

  if (messages.length === 0) {
    return (
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SendIcon />
          </EmptyMedia>
          <EmptyTitle>No sent messages</EmptyTitle>
          <EmptyDescription>
            Outbound messages from this account appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col">
        {messages.map((message) => {
          const recipients = message.recipients.join(", ");

          return (
            <button
              key={message.id}
              type="button"
              onClick={() => onOpen(message.conversationId)}
              aria-label="Open conversation"
              className="flex w-full items-start gap-3 border-b px-4 py-3.5 text-left transition-colors outline-none hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <ContactAvatar name={recipients} className="size-10" />

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    To: {recipients || "unknown recipient"}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(message.sentAt)}
                  </span>
                </div>

                <span className="truncate text-sm text-foreground/90">
                  {message.subject ?? "(No subject)"}
                </span>

                <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {message.snippet || "No content"}
                </span>

                {message.attachments.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {message.attachments.map((attachment) => (
                      <span
                        key={attachment.id}
                        className="inline-flex max-w-40 items-center gap-1 rounded-md border bg-background/80 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                      >
                        <PaperclipIcon className="size-3 shrink-0" />
                        <span className="truncate">{attachment.filename}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

const SentMessageListSkeleton = () => {
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
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
