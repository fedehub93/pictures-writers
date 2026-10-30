"use client";

import { type ReactNode, useMemo } from "react";
import { PenSquareIcon, RefreshCwIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { formatRelativeTime } from "../../lib/format";
import { type SentMessageListItem } from "../../types";
import { SentMessageList } from "./sent-message-list";

interface SentMessagesPanelProps {
  messages: SentMessageListItem[];
  isLoading: boolean;
  onOpen: (conversationId: string) => void;
  /** Epoch ms of the last successful fetch, for the "Last refreshed" label. */
  lastUpdatedAt?: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onCompose: () => void;
  /** Account switcher for small screens; the rail owns it on large screens. */
  accountSelector?: ReactNode;
  /** View switcher for the modes where the rail is not on screen. */
  viewSelector?: ReactNode;
}

export const SentMessagesPanel = ({
  messages,
  isLoading,
  onOpen,
  lastUpdatedAt,
  isRefreshing,
  onRefresh,
  onCompose,
  accountSelector,
  viewSelector,
}: SentMessagesPanelProps) => {
  const refreshedLabel = useMemo(() => {
    if (!lastUpdatedAt) return "Not refreshed yet";
    const relative = formatRelativeTime(new Date(lastUpdatedAt));
    return relative === "now"
      ? "Last refreshed just now"
      : `Last refreshed ${relative}`;
  }, [lastUpdatedAt]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b p-3">
        {(accountSelector || viewSelector) && (
          <div className="flex items-center gap-2 three-panes:hidden">
            {accountSelector && (
              <div className="min-w-0 flex-1">{accountSelector}</div>
            )}
            {viewSelector && (
              <div className="w-36 shrink-0">{viewSelector}</div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Sent</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {messages.length}{" "}
              {messages.length === 1 ? "message" : "messages"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh sent messages"
              title="Refresh"
            >
              <RefreshCwIcon
                className={cn("size-4", isRefreshing && "animate-spin")}
              />
            </Button>
            <Button
              type="button"
              size="icon"
              className="three-panes:hidden"
              onClick={onCompose}
              aria-label="Compose"
              title="Compose"
            >
              <PenSquareIcon className="size-4" />
            </Button>
          </div>
        </div>

        <span className="text-xs text-muted-foreground">{refreshedLabel}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <SentMessageList
          messages={messages}
          isLoading={isLoading}
          onOpen={onOpen}
        />
      </div>
    </div>
  );
};
