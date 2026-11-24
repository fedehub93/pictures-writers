"use client";

import type { MediaFolderSummary } from "../../lib/media-folder";
import type { MediaLibraryEntry } from "../../lib/media-library";

import { MediaCard } from "./media-card";
import { MediaFolderCard } from "./media-folder-card";

interface MediaGridProps {
  items: MediaLibraryEntry[];
  folders: MediaFolderSummary[];
  checkedIds: string[];
  onCheckboxChange: (id: string, isChecked: boolean) => void;
  onOpenFolder: (folderId: string) => void;
  onMove: (mediaId: string) => void;
}

/**
 * The card grid stays a grid: the thumbnail is the content, not a column.
 * Folders are drawn before the Media of the open scope, as a file browser does,
 * and are not paginated: only the folder's contents are pages.
 */
export const MediaGrid = ({
  items,
  folders,
  checkedIds,
  onCheckboxChange,
  onOpenFolder,
  onMove,
}: MediaGridProps) => {
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-4">
      {folders.map((folder) => (
        <MediaFolderCard
          key={folder.id}
          folder={folder}
          onOpen={onOpenFolder}
        />
      ))}
      {items.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          checked={checkedIds.includes(item.id)}
          onCheckboxChange={onCheckboxChange}
          onMove={onMove}
        />
      ))}
    </div>
  );
};
