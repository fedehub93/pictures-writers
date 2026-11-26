"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";

import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";
import { useTRPC } from "@/trpc/client";

import { type MediaLibraryView } from "../../constants";
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
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseMedia(listFilters);

  // The blocks already loaded are one list: the rows keep their place as the
  // next block appends, and folders come from the first block only, so they
  // never repeat above later blocks.
  const items = data.pages.flatMap((page) => page.items);
  const folders = data.pages[0]?.folders ?? [];

  // The Media a move would file: one from a card menu or the whole selection
  // from the bulk toolbar. The dialog lives here so both the Recent box and the
  // My Drive panel can share it.
  const [moveIds, setMoveIds] = useState<string[] | null>(null);

  // Opening a folder is navigation inside My Drive: it always starts the list
  // over, because the loaded blocks belong to the scope they were counted in.
  // An empty string means the My Drive root.
  const openFolder = (folderId: string) =>
    setFilters({
      view: "active",
      folderId: folderId || null,
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

  // A selection belongs to the scope it was made in: loading another block
  // keeps it, because those cards stay on screen, but a new search, view or
  // folder starts a different list and drops it.
  const scopeKey = JSON.stringify([
    filters.search,
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
  // successful move so the checkbox state stays honest. The ids are stamped
  // with the scope they were checked in, so changing search, view or folder
  // yields an empty selection without waiting for an effect.
  const [selection, setSelection] = useState<{
    scope: string;
    ids: string[];
  }>({ scope: scopeKey, ids: [] });

  const setCheckedIdsFromPanel = (
    update: string[] | ((current: string[]) => string[]),
  ) =>
    setSelection((current) => {
      const checked = current.scope === scopeKey ? current.ids : [];
      return {
        scope: scopeKey,
        ids: typeof update === "function" ? update(checked) : update,
      };
    });

  const checkedIdsFromPanel =
    selection.scope === scopeKey ? selection.ids : [];

  // A failed block leaves the control in place and enabled, so the editor can
  // retry; the toast says what went wrong. `throwOnError` is needed because the
  // observer otherwise swallows the rejection.
  const onLoadMore = async () => {
    try {
      await fetchNextPage({ throwOnError: true });
    } catch (error) {
      toast.error(mediaErrorMessage(error));
    }
  };

  return (
    <div className="flex gap-6 px-6">
      <MediaFolderSidebar />
      {/* Remounting on a filter change empties the panel's own state; the
          checked ids are scope-stamped above for the same reason. */}
      <div key={scopeKey} className="min-w-0 flex-1 flex flex-col gap-y-6">
        <MediaRecentBox
          view={listView}
          search={filters.search}
          onMove={(mediaId) => setMoveIds([mediaId])}
        />
        <MediaLibraryPanel
          items={items}
          folders={folders}
          folder={folder ?? null}
          folderPending={openFolderId !== null && isFolderPending}
          view={listView}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          folderTree={folderTree ?? []}
          onLoadMore={() => void onLoadMore()}
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
