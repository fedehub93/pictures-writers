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
  // While searching there is no open folder, so a new folder lands at the root.
  const createFolderTarget = isSearching
    ? null
    : openMediaFolderId({
        view: filters.view,
        folderId: filters.folderId,
      });

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <ContentHeader label="Media" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MediaSearchFilter />
        <div className="flex flex-wrap items-center gap-4">
          {!isArchived && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCreate(createFolderTarget)}
            >
              <FolderPlus />
              New Folder
            </Button>
          )}
          {/* Archived holds files that left the library; uploading there could
              only create an active Media the view would not show. */}
          {!isArchived && (
            <MediaCreateAction
              folderId={openMediaFolderId({
                view: filters.view,
                folderId: filters.folderId,
              })}
            />
          )}
        </div>
      </div>
      {data && (
        <MediaRehomePanel pending={data.rehome} active={data.storage.active} />
      )}
    </div>
  );
};
