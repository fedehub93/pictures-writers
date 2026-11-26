"use client";

import { FolderPlus } from "lucide-react";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { Button } from "@/shared/ui/button";

import { useMediaMeta } from "../../hooks/use-media";
import { useMediaFilters } from "../../hooks/use-media-filters";
import { openMediaFolderId } from "../../lib/media-folder";

import { MediaCreateAction } from "./media-create-action";
import { MediaRehomePanel } from "./media-rehome-panel";
import { MediaSearchFilter } from "./media-search-filter";
import { useMediaFolderDialog } from "./media-folder-dialog-provider";

/**
 * The header owns the page title, the search and the create/upload actions.
 * The rehome banner sits below the control row. The sidebar owns navigation
 * between My Drive and Archived, the folder tree and the storage details. The
 * header renders outside the grid's suspense boundary, so the list resolving
 * never hides the controls.
 */
export const MediaListHeader = () => {
  const [filters] = useMediaFilters();
  const { openCreate } = useMediaFolderDialog();

  const { data } = useMediaMeta({
    search: filters.search,
    view: filters.view,
    folderId: filters.folderId,
  });

  const isArchived = filters.view === "archived";
  const isSearching = filters.search.trim().length > 0;
  // The folder the library is showing, and where an upload or a new folder is
  // filed. While searching there is no open folder, so a new folder lands at the
  // root.
  const folderTarget = openMediaFolderId({
    view: filters.view,
    folderId: filters.folderId,
  });
  const createFolderTarget = isSearching ? null : folderTarget;

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <ContentHeader label="Media" />
      {/* `w-full` lets the search take a line of its own once it can no longer
          share one with the actions; `max-w-lg` bounds it to 32rem either way,
          and `ml-auto` keeps it right-aligned. */}
      <div className="flex flex-wrap items-center gap-4">
        {!isArchived && (
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCreate(createFolderTarget)}
            >
              <FolderPlus />
              New Folder
            </Button>
            {/* Archived holds files that left the library; uploading there
                could only create an active Media the view would not show. */}
            <MediaCreateAction folderId={folderTarget} />
          </div>
        )}
        <div className="w-full max-w-lg ml-auto">
          <MediaSearchFilter />
        </div>
      </div>
      {data && (
        <MediaRehomePanel pending={data.rehome} active={data.storage.active} />
      )}
    </div>
  );
};
