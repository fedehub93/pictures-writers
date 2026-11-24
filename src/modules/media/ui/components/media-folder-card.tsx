"use client";

import { Folder } from "lucide-react";

import { Badge } from "@/shared/ui/badge";

import type { MediaFolderSummary } from "../../lib/media-folder";

interface MediaFolderCardProps {
  folder: MediaFolderSummary;
  /** Opens the folder: the library follows the card into its contents. */
  onOpen: (folderId: string) => void;
}

/**
 * A folder in the grid. It follows the Media card's size and hover treatment so
 * a grid of both reads as one list; it draws no checkbox or actions because
 * folder writes stay in the sidebar.
 */
export const MediaFolderCard = ({ folder, onOpen }: MediaFolderCardProps) => {
  const { id, name, mediaCount } = folder;

  return (
    <button
      type="button"
      onClick={() => onOpen(id)}
      aria-label={`Open ${name}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-lg border text-left transition hover:shadow-2xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
    >
      <div className="relative flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground">
        <Folder className="size-10" strokeWidth={1} />
      </div>
      <div className="flex flex-col gap-y-2 p-3">
        <div className="flex items-center justify-between gap-x-4">
          <div className="truncate text-sm font-medium transition group-hover:text-sky-700">
            {name}
          </div>
          <Badge variant="secondary">Folder</Badge>
        </div>
        <div className="flex items-center justify-between gap-x-4">
          <span className="text-xs text-muted-foreground">Media</span>
          <span className="text-xs">
            {mediaCount} {mediaCount === 1 ? "item" : "items"}
          </span>
        </div>
      </div>
    </button>
  );
};
