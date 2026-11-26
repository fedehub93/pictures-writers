"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";

import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";
import { useTRPC } from "@/trpc/client";

import {
  type MediaLibrarySort,
  type MediaLibraryView,
} from "../../constants";
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
  // keeps it, because those cards stay on screen, but a new search, view,
  // folder or order starts a different list and drops it.
  const scopeKey = JSON.stringify([
    filters.search,
    listView,
    filters.folderId,
    filters.sort,
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
  // with the scope they were checked in; a different scope reads as empty and
  // drops the stale entry, so returning to an earlier scope does not resurrect
  // a selection the editor had already left behind.
  const [selection, setSelection] = useState<{
    scope: string;
    ids: string[];
  }>({ scope: scopeKey, ids: [] });

  if (selection.scope !== scopeKey) {
    setSelection({ scope: scopeKey, ids: [] });
  }

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

  // The panel is the anchor a reorder scrolls back to: the blocks already
  // loaded belonged to the old order, so the editor must see the new list from
  // its first row. The remount key below carries the sort, so the panel's own
  // state (the described Media) is dropped with the selection.
  const panelRef = useRef<HTMLDivElement>(null);

  // The reorder remounts the panel, so the scroll is applied once the new
  // panel is on screen rather than while the old one is still laid out.
  const pendingSortScroll = useRef(false);

  const onSortChange = (sort: MediaLibrarySort) => {
    if (sort === filters.sort) return;

    pendingSortScroll.current = true;
    void setFilters({ sort });
  };

  useEffect(() => {
    if (!pendingSortScroll.current) return;

    pendingSortScroll.current = false;
    panelRef.current?.scrollIntoView({ block: "start" });
  }, [filters.sort]);

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
      <div className="min-w-0 flex-1 flex flex-col gap-y-6">
        {/* The reveal resets when the search or view changes, but a reorder
            leaves the newest-first preview, and its open second row, alone. */}
        <MediaRecentBox
          key={JSON.stringify([filters.search, listView, filters.folderId])}
          view={listView}
          search={filters.search}
          onMove={(mediaId) => setMoveIds([mediaId])}
        />
        {/* The ref stays mounted across a reorder, so the scroll lands on the
            panel even though the panel itself remounts to drop its own state. */}
        <div ref={panelRef}>
          {/* Remounting on a scope change empties the panel's own state; the
              checked ids are scope-stamped above for the same reason. */}
          <MediaLibraryPanel
            key={scopeKey}
            items={items}
            folders={folders}
            folder={folder ?? null}
            folderPending={openFolderId !== null && isFolderPending}
            view={listView}
            sort={filters.sort}
            onSortChange={onSortChange}
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
