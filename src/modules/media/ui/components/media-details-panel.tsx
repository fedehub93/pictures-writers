"use client";

import { Folder } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { formatBytes, formatDate } from "@/lib/format";

import type { MediaFolderDetails } from "../../lib/media-folder";
import {
  formatMediaDimensions,
  type MediaLibraryItem,
} from "../../lib/media-library";

import { MediaDetailRow } from "./media-detail-row";

interface MediaDetailsPanelProps {
  /** The selected Media, or null when none is selected. */
  media: MediaLibraryItem | null;
  /** The folder the editor has open, or null outside My Drive. */
  folder: MediaFolderDetails | null;
  /** True while the open folder's details are being read for the first time. */
  folderPending?: boolean;
}

/**
 * The read-only details of the selected item. A Media always wins over the
 * folder the editor has open; editing and destructive actions stay on the card
 * and the bulk toolbar, so this panel is a place to read, not a second control
 * surface. The parent supplies the column layout and border.
 */
export const MediaDetailsPanel = ({
  media,
  folder,
  folderPending = false,
}: MediaDetailsPanelProps) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xs font-medium uppercase text-muted-foreground">
        Details
      </h2>
      {media ? (
        <MediaDetails media={media} />
      ) : folder ? (
        <FolderDetails folder={folder} />
      ) : folderPending ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Loading folder details…
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Select an item to view more information
        </p>
      )}
    </div>
  );
};

function MediaDetails({ media }: { media: MediaLibraryItem }) {
  const {
    name,
    type,
    size,
    mimeType,
    checksum,
    storageDriver,
    url,
    archivedAt,
  } = media;
  const dimensions = formatMediaDimensions(media);

  return (
    <div className="mt-3 flex flex-col gap-y-3">
      <div className="flex items-start justify-between gap-x-2">
        <h3 className="min-w-0 text-sm font-medium break-words">{name}</h3>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {archivedAt && <Badge variant="secondary">Archived</Badge>}
          <Badge>{type}</Badge>
        </div>
      </div>

      <dl className="flex flex-col gap-y-2">
        <MediaDetailRow
          label="Size"
          value={size === null ? "—" : formatBytes(size)}
        />
        <MediaDetailRow label="Dimensions" value={dimensions ?? "—"} />
        <MediaDetailRow label="MIME" value={mimeType ?? "—"} />
        <MediaDetailRow
          label="Checksum"
          value={checksum ?? "—"}
          mono
          breakAll
        />
        <MediaDetailRow label="Storage driver" value={storageDriver ?? "—"} />
        <MediaDetailRow
          label="Created"
          value={formatDate({ date: media.createdAt })}
        />
        <MediaDetailRow
          label="Updated"
          value={formatDate({ date: media.updatedAt })}
        />
      </dl>

      <div className="flex flex-col gap-y-1">
        <span className="text-xs text-muted-foreground">Public URL</span>
        <code className="min-w-0 rounded bg-muted px-2 py-1 text-xs break-all">
          {url || "—"}
        </code>
      </div>
    </div>
  );
}

function FolderDetails({ folder }: { folder: MediaFolderDetails }) {
  return (
    <div className="mt-3 flex flex-col gap-y-3">
      <div className="flex items-center gap-x-2">
        <Folder className="size-4 shrink-0 text-muted-foreground" />
        <h3 className="min-w-0 text-sm font-medium break-words">
          {folder.name}
        </h3>
      </div>

      <dl className="flex flex-col gap-y-2">
        <MediaDetailRow
          label="Items"
          value={`${folder.mediaCount} ${
            folder.mediaCount === 1 ? "item" : "items"
          }`}
        />
        <MediaDetailRow
          label="Total size"
          value={formatBytes(folder.totalSize)}
          title="Stored originals only. Generated renditions share the storage quota but are not counted."
        />
        <MediaDetailRow
          label="Created"
          value={formatDate({ date: folder.createdAt })}
        />
        <MediaDetailRow
          label="Updated"
          value={formatDate({ date: folder.updatedAt })}
        />
      </dl>
    </div>
  );
}
