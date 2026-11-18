"use client";

import type { MediaLibraryEntry } from "../../lib/media-library";

import { MediaCard } from "./media-card";

interface MediaGridProps {
  items: MediaLibraryEntry[];
  checkedIds: string[];
  onCheckboxChange: (id: string, isChecked: boolean) => void;
}

/**
 * The card grid stays a grid: the thumbnail is the content, not a column.
 */
export const MediaGrid = ({
  items,
  checkedIds,
  onCheckboxChange,
}: MediaGridProps) => {
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-4">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          checked={checkedIds.includes(item.id)}
          onCheckboxChange={onCheckboxChange}
        />
      ))}
    </div>
  );
};
