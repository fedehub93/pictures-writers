"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PenSquareIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Input } from "@/shared/ui/input";

import { formatRelativeTime } from "../../lib/format";
import { type ConversationListItem as ConversationListItemType } from "../../types";
import { ConversationList } from "./conversation-list";

const PAGE_SIZE = 20;

interface ConversationListPanelProps {
  conversations: ConversationListItemType[];
  isLoading: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
  onMarkRead?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  /** Epoch ms of the last successful fetch, for the "Last refreshed" label. */
  lastUpdatedAt?: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onCompose: () => void;
  /** Account switcher for small screens; the rail owns it on large screens. */
  accountSelector?: ReactNode;
}

export const ConversationListPanel = ({
  conversations,
  isLoading,
  selectedId,
  onSelect,
  onMarkRead,
  onMarkUnread,
  lastUpdatedAt,
  isRefreshing,
  onRefresh,
  onCompose,
  accountSelector,
}: ConversationListPanelProps) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.contactName,
        conversation.contactEmail,
        conversation.lastMessage?.subject,
        conversation.lastMessage?.snippet,
        ...(conversation.lastMessage?.attachments?.map(
          (attachment) => attachment.filename,
        ) ?? []),
      ];

      return haystack.some((value) => value?.toLowerCase().includes(query));
    });
  }, [conversations, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const refreshedLabel = useMemo(() => {
    if (!lastUpdatedAt) return "Not refreshed yet";
    const relative = formatRelativeTime(new Date(lastUpdatedAt));
    return relative === "now"
      ? "Last refreshed just now"
      : `Last refreshed ${relative}`;
  }, [lastUpdatedAt]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b p-3">
        {accountSelector && <div className="lg:hidden">{accountSelector}</div>}

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              className="h-9 pl-9"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh conversations"
            title="Refresh"
          >
            <RefreshCwIcon
              className={cn("size-4", isRefreshing && "animate-spin")}
            />
          </Button>
          <Button
            type="button"
            size="icon"
            className="lg:hidden"
            onClick={onCompose}
            aria-label="Compose"
            title="Compose"
          >
            <PenSquareIcon className="size-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{refreshedLabel}</span>
          <div className="flex shrink-0 items-center gap-1">
            <span>
              {filtered.length === 0
                ? "0"
                : `${start + 1}-${Math.min(start + PAGE_SIZE, filtered.length)}`}{" "}
              of {filtered.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={currentPage === 0}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() =>
                setPage((current) => Math.min(totalPages - 1, current + 1))
              }
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {!isLoading && search.trim() && filtered.length === 0 ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>No results</EmptyTitle>
              <EmptyDescription>
                No conversation matches your search.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ConversationList
            conversations={pageItems}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={onSelect}
            onMarkRead={onMarkRead}
            onMarkUnread={onMarkUnread}
          />
        )}
      </div>
    </div>
  );
};
