"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { Archive, FolderInput, Trash } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/shared/ui/button";
import { DataPagination } from "@/shared/components/data-pagination";
import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { DEFAULT_PAGE, type MediaLibraryView } from "../../constants";
import { mediaErrorMessage } from "../../lib/error-message";
import { mediaDeletionCleanupNotice } from "../../lib/deletion-notice";
import {
  openMediaFolderId,
  type MediaFolderDetails,
  type MediaFolderSummary,
} from "../../lib/media-folder";
import {
  MEDIA_USAGE_NOTE,
  type MediaLibraryEntry,
} from "../../lib/media-library";
import { useMediaFilters } from "../../hooks/use-media-filters";
import { useMediaInvalidation } from "../../hooks/use-media-invalidation";
import {
  useMediaFolderDetails,
  useMediaFolderTree,
  useSuspenseMedia,
} from "../../hooks/use-media";

import { MediaDetailsPanel } from "../components/media-details-panel";
import { MediaGrid } from "../components/media-grid";
import { MediaFolderSidebar } from "../components/media-folder-sidebar";
import { MediaMoveDialog } from "../components/media-move-dialog";

export const MediaView = () => {
  const [filters, setFilters] = useMediaFilters();
  const { data } = useSuspenseMedia(filters);

  // Opening a folder is navigation inside My Drive: it always returns to page
  // one, because a page number belongs to the scope it was counted in.
  const openFolder = (folderId: string) =>
    setFilters({ view: "active", folderId, page: DEFAULT_PAGE });

  // A selection belongs to the page it was made on: the same id may open
  // another page, view or folder, where the details it would show are gone.
  const scopeKey = JSON.stringify([
    filters.search,
    filters.page,
    filters.view,
    filters.folderId,
  ]);

  // Opening a folder selects it: the panel describes the folder the editor
  // entered, so a folder is as readable as a Media. Recent and Archived are
  // flat views with no folder to describe.
  const openFolderId = openMediaFolderId(filters);
  const { data: folder, isPending: isFolderPending } =
    useMediaFolderDetails(openFolderId);

  return (
    <div className="flex gap-6 px-6">
      <MediaFolderSidebar />
      {/* Remounting on a filter change is what empties the selection: it never
          survives into a page, search, view or folder the admin cannot see. */}
      <MediaLibrary
        key={scopeKey}
        items={data.items}
        folders={data.folders}
        folder={folder ?? null}
        folderPending={openFolderId !== null && isFolderPending}
        view={filters.view}
        page={filters.page}
        totalPages={data.totalPages}
        onPageChange={(page) => setFilters({ page })}
        onOpenFolder={openFolder}
      />
    </div>
  );
};

interface MediaLibraryProps {
  items: MediaLibraryEntry[];
  folders: MediaFolderSummary[];
  folder: MediaFolderDetails | null;
  folderPending: boolean;
  view: MediaLibraryView;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenFolder: (folderId: string) => void;
}

const MediaLibrary = ({
  items,
  folders,
  folder,
  folderPending,
  view,
  page,
  totalPages,
  onPageChange,
  onOpenFolder,
}: MediaLibraryProps) => {
  const trpc = useTRPC();
  const { invalidateLibrary } = useMediaInvalidation();
  const { data: folderTree } = useMediaFolderTree();
  const archive = useMutation(trpc.media.archive.mutationOptions());
  const remove = useMutation(trpc.media.removeMany.mutationOptions());
  const move = useMutation(trpc.media.moveMedia.mutationOptions());

  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  // The one Media whose details the panel describes. It is dropped when the
  // row is no longer on screen, so the panel cannot outlive its subject.
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const selectedMedia =
    items.find((item) => item.id === selectedMediaId) ?? null;
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  // The Media a move would file: the whole selection from the toolbar, or the
  // one card whose menu opened the picker.
  const [moveIds, setMoveIds] = useState<string[] | null>(null);

  // The grid and the batch consume only ids that are on screen right now, so a
  // row removed by a refetch after a refused action cannot be acted on and is
  // not drawn as checked.
  const selectedIds = checkedIds.filter((id) =>
    items.some((item) => item.id === id),
  );
  const canShowBulkAction = selectedIds.length > 0;
  const isBulkPending =
    isBulkLoading || archive.isPending || remove.isPending || move.isPending;

  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    setCheckedIds((current) =>
      isChecked
        ? [...new Set([...current, id])]
        : current.filter((candidate) => candidate !== id),
    );
  };

  const runBulkAction = async <T,>(
    action: (ids: string[]) => Promise<T>,
    announce: (result: T) => void,
    ids: string[] = selectedIds,
  ): Promise<boolean> => {
    try {
      setIsBulkLoading(true);
      announce(await action(ids));
      // Only the rows this action consumed stop being checked: a card's move
      // must not drop a selection the editor made for another batch.
      setCheckedIds((current) =>
        current.filter((candidate) => !ids.includes(candidate)),
      );
      return true;
    } catch (error) {
      toast.error(mediaErrorMessage(error));
      return false;
    } finally {
      // A refused batch writes nothing, but the resync repairs drift from
      // another tab and proves the rows, count and quota the admin sees.
      await invalidateLibrary();
      setIsBulkLoading(false);
    }
  };

  const onBulkArchive = () =>
    runBulkAction(
      (ids) => archive.mutateAsync({ ids }),
      (count) => toast.success(`Archived ${count} Media`),
    );

  const onBulkDelete = () =>
    runBulkAction(
      (ids) => remove.mutateAsync({ ids }),
      ({ deleted, cleanup }) => {
        toast.success(`Deleted ${deleted} Media permanently`);

        const notice = mediaDeletionCleanupNotice(cleanup);
        if (notice) toast(notice);
      },
    );

  const onMove = async (folderId: string | null) => {
    if (!moveIds) return;
    const ids = moveIds;

    const moved = await runBulkAction(
      (targetIds) => move.mutateAsync({ ids: targetIds, folderId }),
      ({ moved }) => toast.success(`Moved ${moved} Media`),
      ids,
    );

    // A refused target keeps the picker open, so the editor can choose another
    // folder without repeating the selection.
    if (moved) setMoveIds(null);
  };

  return (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
          <p className="text-xs text-muted-foreground">{MEDIA_USAGE_NOTE}</p>
          {canShowBulkAction && (
            <div className="flex items-center gap-x-2">
              {view !== "archived" && (
                <Button
                  disabled={isBulkPending}
                  variant="outline"
                  size="sm"
                  onClick={() => setMoveIds(selectedIds)}
                >
                  <FolderInput />
                  Move to folder
                </Button>
              )}
              {view === "active" && (
                <ConfirmModal
                  title="Archive selected Media?"
                  description="Archived Media leave the library but keep being served and referenced by published content. You can restore them later."
                  confirmLabel="Archive"
                  onConfirm={onBulkArchive}
                >
                  <Button disabled={isBulkPending} variant="outline" size="sm">
                    <Archive />
                    Archive
                  </Button>
                </ConfirmModal>
              )}
              {view === "archived" && (
                <ConfirmModal
                  title="Delete selected Media permanently?"
                  description="Permanent deletion removes the file and every generated rendition. It cannot be undone, and it is refused while content still references a Media."
                  confirmLabel="Delete permanently"
                  onConfirm={onBulkDelete}
                >
                  <Button
                    disabled={isBulkPending}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash />
                    Delete
                  </Button>
                </ConfirmModal>
              )}
            </div>
          )}
        </div>
        <MediaGrid
          items={items}
          folders={folders}
          checkedIds={selectedIds}
          selectedMediaId={selectedMediaId}
          onCheckboxChange={handleCheckboxChange}
          onSelectMedia={setSelectedMediaId}
          onOpenFolder={onOpenFolder}
          onMove={(mediaId) => setMoveIds([mediaId])}
        />
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
        {items.length === 0 && folders.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-10">
            {view === "archived"
              ? "No archived Media found"
              : view === "recent"
                ? "No Media uploaded yet"
                : "No Media found"}
          </div>
        )}
        <DataPagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
      <MediaDetailsPanel
        media={selectedMedia}
        folder={folder}
        folderPending={folderPending}
      />
    </>
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
