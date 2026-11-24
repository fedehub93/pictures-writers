"use client";

import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { DataPagination } from "@/shared/components/data-pagination";

import { DEFAULT_PAGE } from "@/modules/media/constants";
import type { MediaLibraryView } from "@/modules/media/constants";
import { RECENT_PREVIEW_COUNT, useMediaRecent } from "@/modules/media/hooks/use-media";

import { MediaCard } from "./media-card";

interface MediaRecentBoxProps {
  /** The current library view. The box only renders inside My Drive. */
  view: MediaLibraryView;
  /** The current search term. The box is hidden while searching. */
  search: string;
  /** Opens the folder picker for one Media. */
  onMove: (id: string) => void;
}

/**
 * A preview of the newest active Media. It is shown inside My Drive only, is
 * hidden while searching and never drawn when the library has no active Media.
 * "View all" expands the box in place with its own pagination; the expansion is
 * UI state, not URL state, and resets on navigation.
 */
export const MediaRecentBox = ({ view, search, onMove }: MediaRecentBoxProps) => {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(DEFAULT_PAGE);

  const { data } = useMediaRecent(page);

  if (view !== "active" || search.trim().length > 0) return null;
  if (!data || data.total === 0) return null;

  const visibleItems = expanded
    ? data.items
    : data.items.slice(0, RECENT_PREVIEW_COUNT);

  return (
    <section aria-label="Recent Media" className="rounded-lg border">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-sm font-medium">Recent</h2>
        {data.total > RECENT_PREVIEW_COUNT && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setExpanded((current) => !current);
              setPage(DEFAULT_PAGE);
            }}
          >
            {expanded ? "Show less" : "View all"}
          </Button>
        )}
      </div>
      <div className="p-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
          {visibleItems.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              checked={false}
              selected={false}
              selectable={false}
              allowsSelection={false}
              showArchivedBadge={false}
              onCheckboxChange={() => undefined}
              onSelect={() => undefined}
              onMove={onMove}
            />
          ))}
        </div>
        {expanded && (
          <DataPagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </section>
  );
};
