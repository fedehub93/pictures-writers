"use client";

import { PaperclipIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { formatRelativeTime } from "../../lib/format";
import { type ConversationListItem as ConversationListItemType } from "../../types";
import { ContactAvatar } from "./contact-avatar";

interface ConversationListItemProps {
  conversation: ConversationListItemType;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const ConversationListItem = ({
  conversation,
  isSelected,
  onSelect,
}: ConversationListItemProps) => {
  const displayName = conversation.contactName ?? conversation.contactEmail;
  const { lastMessage } = conversation;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={cn(
        "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none",
        isSelected && "bg-accent",
      )}
    >
      <div className="relative shrink-0">
        <ContactAvatar name={displayName} />
        {conversation.hasUnread && (
          <span
            role="status"
            aria-label="Unread"
            className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">{displayName}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(conversation.updatedAt)}
          </span>
        </div>

        <span
          className={cn(
            "truncate text-sm",
            conversation.hasUnread
              ? "font-medium text-foreground"
              : "text-foreground/90",
          )}
        >
          {lastMessage?.subject ?? "(No subject)"}
        </span>

        <span className="truncate text-xs text-muted-foreground">
          {lastMessage?.snippet || "No content"}
        </span>

        {lastMessage?.hasAttachments && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <PaperclipIcon className="size-3" />
            Attachment
          </span>
        )}
      </div>
    </button>
  );
};
