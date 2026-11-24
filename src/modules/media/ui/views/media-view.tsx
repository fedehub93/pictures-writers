"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";

import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";
import { useTRPC } from "@/trpc/client";

import { DEFAULT_PAGE, type MediaLibraryView } from "../../constants";
import { mediaErrorMessage } from "../../lib/error-message";
import { openMediaFolderId } from "../../lib/media-folder";
import { useMediaFilters } from "../../hooks/use-media-filters";
import { useMediaInvalidation } from "../../hooks/use-media-invalidation";
import {
  useMediaFolderDetails,
  useMediaFolderTree,
  useSuspenseMedia,
} from "../../hooks/use-media";

import { MediaFolderSidebar } from "../components/media-folder-sidebar";
import { MediaLibraryPanel } from "../components/media-library-panel";
import { MediaMoveDialog } from "../components/media-move-dialog";
import { MediaRecentBox } from "../components/media-recent-box";

export const MediaView = () => {
  const trpc = useTRPC();
  const { invalidateLibrary } = useMediaInvalidation();
  const move = useMutation(trpc.media.moveMedia.mutationOptions());
  const [filters, setFilters] = useMediaFilters();
  // An old ?view=recent link lands on My Drive with the Recent box collapsed;
  // it must not render an error or an empty page.
  const listView: MediaLibraryView =
    filters.view === "recent" ? "active" : filters.view;
  const listFilters = { ...filters, view: listView };
  const { data } = useSuspenseMedia(listFilters);

  // The Media a move would file: one from a card menu or the whole selection
  // from the bulk toolbar. The dialog lives here so both the Recent box and the
  // My Drive panel can share it.
  const [moveIds, setMoveIds] = useState<string[] | null>(null);

  // Opening a folder is navigation inside My Drive: it always returns to page
  // one, because a page number belongs to the scope it was counted in. An empty
  // string means the My Drive root.
  const openFolder = (folderId: string) =>
    setFilters({
      view: "active",
      folderId: folderId || null,
      page: DEFAULT_PAGE,
    });

  const onMove = async (folderId: string | null) => {
    if (!moveIds) return;
    const ids = moveIds;

    try {
      const result = await move.mutateAsync({ ids, folderId });
      toast.success(`Moved ${result.moved} Media`);
      setCheckedIdsFromPanel((current) =>
        current.filter((candidate) => !ids.includes(candidate)),
      );
      setMoveIds(null);
    } catch (error) {
      toast.error(mediaErrorMessage(error));
    } finally {
      await invalidateLibrary();
    }
  };

  // A selection belongs to the page it was made on: the same id may open
  // another page, view or folder, where the details it would show are gone.
  const scopeKey = JSON.stringify([
    filters.search,
    filters.page,
    listView,
    filters.folderId,
  ]);

  // Opening a folder selects it: the panel describes the folder the editor
  // entered, so a folder is as readable as a Media. Archived is a flat view
  // with no folder to describe.
  const openFolderId = openMediaFolderId({
    view: listView,
    folderId: filters.folderId,
  });
  const { data: folder, isPending: isFolderPending } =
    useMediaFolderDetails(openFolderId);
  const { data: folderTree } = useMediaFolderTree();

  // The My Drive panel owns checked ids; the view needs to clear them after a
  // successful move so the checkbox state stays honest.
  const [checkedIdsFromPanel, setCheckedIdsFromPanel] = useState<string[]>([]);

  return (
    <div className="flex gap-6 px-6">
      <MediaFolderSidebar />
      {/* Remounting on a filter change is what empties the selection: it never
          survives into a page, search, view or folder the admin cannot see. */}
      <div key={scopeKey} className="min-w-0 flex-1 flex flex-col gap-y-6">
        <MediaRecentBox
          view={listView}
          search={filters.search}
          onMove={(mediaId) => setMoveIds([mediaId])}
        />
        <MediaLibraryPanel
          items={data.items}
          folders={data.folders}
          folder={folder ?? null}
          folderPending={openFolderId !== null && isFolderPending}
          view={listView}
          page={filters.page}
          totalPages={data.totalPages}
          folderTree={folderTree ?? []}
          onPageChange={(page) => setFilters({ page })}
          onOpenFolder={openFolder}
          onRequestMove={(ids) => setMoveIds(ids)}
          checkedIds={checkedIdsFromPanel}
          onCheckedIdsChange={setCheckedIdsFromPanel}
        />
      </div>

      {moveIds && (
        <MediaMoveDialog
          open
          count={moveIds.length}
          folders={folderTree ?? []}
          isPending={move.isPending}
          onOpenChange={(open) => {
            if (!open) setMoveIds(null);
          }}
          onConfirm={onMove}
        />
      )}
    </div>
  );
};

export const MediaViewLoading = () => {
  return (
    <LoadingState
      title="Loading Media"
      description="This may take a few seconds"
    />
  );
};

export const MediaViewError = () => {
  return <ErrorState title="Error Media" description="Something went wrong" />;
};
