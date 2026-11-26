"use client";

import { useState } from "react";

import type { MediaLibraryView } from "@/modules/media/constants";
import {
  RECENT_BOX_SIZE,
  RECENT_PREVIEW_COUNT,
  useMediaRecent,
} from "@/modules/media/hooks/use-media";

import { MediaCard } from "./media-card";
import { MediaViewMore } from "./media-view-more";

interface MediaRecentBoxProps {
  /** The current library view. The box only renders inside My Drive. */
  view: MediaLibraryView;
  /** The current search term. The box is hidden while searching. */
  search: string;
  /** Opens the folder picker for one Media. */
  onMove: (id: string) => void;
}

/**
 * A preview of the newest active Media, capped at two rows. It is shown inside
 * My Drive only, is hidden while searching and never drawn when the library has
 * no active Media. The single read holds eight rows; "View more" reveals the
 * second four locally, so the reveal needs no request. The reveal is UI state,
 * not URL state, and resets on navigation.
 */
export const MediaRecentBox = ({ view, search, onMove }: MediaRecentBoxProps) => {
  const [revealed, setRevealed] = useState(RECENT_PREVIEW_COUNT);

  const { data } = useMediaRecent();

  if (view !== "active" || search.trim().length > 0) return null;
  if (!data || data.total === 0) return null;

  const visibleItems = data.items.slice(0, revealed);
  const limit = Math.min(RECENT_BOX_SIZE, data.items.length);

  return (
    <section aria-label="Recent Media" className="rounded-lg border">
      <div className="border-b p-4">
        <h2 className="text-sm font-medium">Recent</h2>
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
        {revealed < limit && (
          <MediaViewMore
            onClick={() =>
              setRevealed((current) =>
                Math.min(current + RECENT_PREVIEW_COUNT, RECENT_BOX_SIZE),
              )
            }
          />
        )}
      </div>
    </section>
  );
};
