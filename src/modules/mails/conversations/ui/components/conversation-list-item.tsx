"use client";

import { PaperclipIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { formatRelativeTime } from "../../lib/format";
import { type ConversationListItem as ConversationListItemType } from "../../types";
import { ContactAvatar } from "./contact-avatar";
import { ConversationReadMenu } from "./conversation-read-menu";

interface ConversationListItemProps {
  conversation: ConversationListItemType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMarkRead?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
}

export const ConversationListItem = ({
  conversation,
  isSelected,
  onSelect,
  onMarkRead,
  onMarkUnread,
}: ConversationListItemProps) => {
  const displayName = conversation.contactName ?? conversation.contactEmail;
  const { lastMessage } = conversation;
  const attachments = lastMessage?.attachments ?? [];

  return (
    <div
      className={cn(
        "relative flex w-full items-start gap-2 border-b px-4 py-3.5 transition-colors hover:bg-accent/50",
        isSelected && "bg-accent hover:bg-accent",
      )}
    >
      {isSelected && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-0.5 bg-primary"
        />
      )}

      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        aria-current={isSelected ? "true" : undefined}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
      <div className="relative shrink-0">
        <ContactAvatar name={displayName} className="size-10" />
        {conversation.isUnread && (
          <span
            role="status"
            aria-label="Unread"
            className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-card"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              conversation.isUnread ? "font-semibold" : "font-medium",
            )}
          >
            {displayName}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(
              conversation.lastMessage?.sentAt ?? conversation.updatedAt,
            )}
          </span>
        </div>

        <span
          className={cn(
            "truncate text-sm",
            conversation.isUnread
              ? "font-semibold text-foreground"
              : "text-foreground/90",
          )}
        >
          {lastMessage?.subject ?? "(No subject)"}
        </span>

        <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {lastMessage?.direction === "OUTBOUND" && (
            <span className="font-medium text-foreground/70">You: </span>
          )}
          {lastMessage?.snippet || "No content"}
        </span>

        {attachments.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {attachments.slice(0, 2).map((attachment, index) => (
              <span
                key={`${attachment.filename}-${index}`}
                className="inline-flex max-w-40 items-center gap-1 rounded-md border bg-background/80 px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                <PaperclipIcon className="size-3 shrink-0" />
                <span className="truncate">{attachment.filename}</span>
              </span>
            ))}
            {attachments.length > 2 && (
              <span className="text-[11px] text-muted-foreground">+more</span>
            )}
          </div>
        )}
      </div>
      </button>

      <ConversationReadMenu
        isUnread={conversation.isUnread}
        onMarkRead={() => onMarkRead?.(conversation.id)}
        onMarkUnread={() => onMarkUnread?.(conversation.id)}
      />
    </div>
  );
};
